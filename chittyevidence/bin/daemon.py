#!/usr/bin/env python3
"""
Marie Kondo Evidence System - Always-On Daemon
==============================================
Monitors incoming evidence, builds key documents, and integrates with:
- ChittyID: Identity management
- ChittyLedger: Evidence registry
- ChittyVerify: Document verification
- ChittyChain: Blockchain evidence storage
- ChittyTrust: Trust verification
"""

import os
import sys
import time
import json
import logging
import schedule
import threading
from pathlib import Path
from datetime import datetime
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler
from dotenv import load_dotenv
import requests

# Add lib to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'lib'))
from evidence_core import EvidenceProcessor, ChittyIntegration

# Load environment variables
load_dotenv(Path(__file__).parent.parent / 'config' / '.env')

# Configure logging
logging.basicConfig(
    level=getattr(logging, os.getenv('LOG_LEVEL', 'INFO')),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(os.getenv('LOG_FILE', 'logs/marie_kondo.log')),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger('MarieKondoDaemon')


class ChittyChainIntegration:
    """Integration with ChittyChain for blockchain evidence"""
    
    def __init__(self, api_endpoint: str):
        self.api_endpoint = api_endpoint
        
    def store_evidence_hash(self, file_hash: str, metadata: dict) -> str:
        """Store evidence hash on ChittyChain"""
        try:
            response = requests.post(
                f"{self.api_endpoint}/evidence/store",
                json={
                    "hash": file_hash,
                    "metadata": metadata,
                    "timestamp": datetime.now().isoformat()
                }
            )
            if response.status_code == 200:
                return response.json()["transaction_id"]
        except Exception as e:
            logger.error(f"ChittyChain storage failed: {e}")
        return None


class ChittyVerifyIntegration:
    """Integration with ChittyVerify for document verification"""
    
    def __init__(self, api_endpoint: str):
        self.api_endpoint = api_endpoint
        
    def verify_document(self, file_path: Path) -> dict:
        """Verify document authenticity"""
        try:
            with open(file_path, 'rb') as f:
                response = requests.post(
                    f"{self.api_endpoint}/verify",
                    files={'document': f}
                )
            if response.status_code == 200:
                return response.json()
        except Exception as e:
            logger.error(f"ChittyVerify failed: {e}")
        return {"verified": False, "error": str(e)}


class ChittyTrustIntegration:
    """Integration with ChittyTrust for trust scoring"""
    
    def __init__(self, api_endpoint: str):
        self.api_endpoint = api_endpoint
        
    def calculate_trust_score(self, evidence_data: dict) -> float:
        """Calculate trust score for evidence"""
        try:
            response = requests.post(
                f"{self.api_endpoint}/trust/calculate",
                json=evidence_data
            )
            if response.status_code == 200:
                return response.json()["trust_score"]
        except Exception as e:
            logger.error(f"ChittyTrust scoring failed: {e}")
        return 0.0


class EvidenceWatcher(FileSystemEventHandler):
    """Watch for new evidence files"""
    
    def __init__(self, processor):
        self.processor = processor
        self.processing_lock = threading.Lock()
        
    def on_created(self, event):
        if not event.is_directory:
            # Wait for file to be fully written
            time.sleep(1)
            self.process_file(event.src_path)
            
    def on_moved(self, event):
        if not event.is_directory:
            time.sleep(1)
            self.process_file(event.dest_path)
            
    def process_file(self, filepath):
        """Process new evidence file"""
        with self.processing_lock:
            try:
                filepath = Path(filepath)
                if filepath.suffix.lower() in ['.pdf', '.doc', '.docx', '.txt', '.jpg', '.png']:
                    logger.info(f"Processing new evidence: {filepath.name}")
                    
                    # Process through evidence core
                    result = self.processor.process_evidence(filepath)
                    
                    if result:
                        logger.info(f"✅ Processed: {result['exhibit_id']} in {result['category']}")
                        
                        # Send notification if enabled
                        if os.getenv('NOTIFY_ON_NEW_EVIDENCE', 'true').lower() == 'true':
                            self.send_notification(result)
                    else:
                        logger.warning(f"⚠️ File already processed or duplicate: {filepath.name}")
                        
            except Exception as e:
                logger.error(f"Error processing {filepath}: {e}")
                
    def send_notification(self, evidence_data):
        """Send notification about new evidence"""
        webhook_url = os.getenv('WEBHOOK_URL')
        if webhook_url:
            try:
                requests.post(webhook_url, json={
                    "event": "new_evidence",
                    "data": evidence_data,
                    "timestamp": datetime.now().isoformat()
                })
            except:
                pass


class DocumentBuilder:
    """Build key evidentiary documents"""
    
    def __init__(self, lockbox_dir: Path, chitty_integration):
        self.lockbox_dir = lockbox_dir
        self.chitty = chitty_integration
        
    def build_timeline(self):
        """Build case timeline from evidence"""
        logger.info("Building case timeline...")
        
        # Query all evidence ordered by date
        evidence = self.chitty.search_evidence({
            "order_by": "created_at"
        })
        
        timeline_entries = []
        for item in evidence:
            # Extract date from metadata or filename
            date = self._extract_date(item)
            if date:
                timeline_entries.append({
                    "date": date,
                    "exhibit_id": item["exhibit_id"],
                    "description": item["original_name"],
                    "category": item["category"],
                    "tags": item.get("tags", [])
                })
                
        # Sort by date
        timeline_entries.sort(key=lambda x: x["date"])
        
        # Write timeline
        timeline_path = self.lockbox_dir / "00_CASE_TIMELINE" / "auto_timeline.md"
        timeline_path.parent.mkdir(exist_ok=True)
        
        with open(timeline_path, 'w') as f:
            f.write("# Automated Case Timeline\n")
            f.write(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
            
            for entry in timeline_entries:
                f.write(f"## {entry['date']} - {entry['exhibit_id']}\n")
                f.write(f"- **File**: {entry['description']}\n")
                f.write(f"- **Category**: {entry['category']}\n")
                f.write(f"- **Tags**: {', '.join(entry['tags'])}\n\n")
                
        logger.info(f"Timeline updated: {timeline_path}")
        
    def build_key_documents_index(self):
        """Build index of key documents"""
        logger.info("Building key documents index...")
        
        # Query high-priority evidence
        key_evidence = self.chitty.search_evidence({
            "tags": ["key-exhibit", "critical"]
        })
        
        # Group by category
        by_category = {}
        for item in key_evidence:
            cat = item["category"]
            if cat not in by_category:
                by_category[cat] = []
            by_category[cat].append(item)
            
        # Write index
        index_path = self.lockbox_dir / "00_KEY_EXHIBITS" / "key_documents_index.md"
        index_path.parent.mkdir(exist_ok=True)
        
        with open(index_path, 'w') as f:
            f.write("# Key Documents Index\n")
            f.write(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
            
            for category, items in sorted(by_category.items()):
                f.write(f"## {category}\n\n")
                for item in items:
                    f.write(f"- **{item['exhibit_id']}**: {item['original_name']}\n")
                    chain_events = self.chitty.get_evidence_chain(item['file_hash'])
                    f.write(f"  - Added: {item['created_at']}\n")
                    f.write(f"  - Events: {len(chain_events)}\n")
                    
        logger.info(f"Key documents index updated: {index_path}")
        
    def build_chain_of_custody_report(self):
        """Build chain of custody report"""
        logger.info("Building chain of custody report...")
        
        # Get all evidence with full event history
        all_evidence = self.chitty.search_evidence({})
        
        report_path = self.lockbox_dir / "00_EVIDENCE_INDEX" / "chain_of_custody.json"
        report_path.parent.mkdir(exist_ok=True)
        
        custody_data = []
        for item in all_evidence:
            events = self.chitty.get_evidence_chain(item['file_hash'])
            custody_data.append({
                "exhibit_id": item['exhibit_id'],
                "file_hash": item['file_hash'],
                "original_name": item['original_name'],
                "events": [
                    {
                        "type": e['event_type'],
                        "timestamp": e['timestamp'].isoformat(),
                        "data": e['event_data']
                    }
                    for e in events
                ]
            })
            
        with open(report_path, 'w') as f:
            json.dump(custody_data, f, indent=2)
            
        logger.info(f"Chain of custody report updated: {report_path}")
        
    def _extract_date(self, evidence_item):
        """Extract date from evidence metadata or filename"""
        import re
        
        # Try metadata first
        if 'date' in evidence_item.get('metadata', {}):
            return evidence_item['metadata']['date']
            
        # Try filename
        filename = evidence_item['original_name']
        patterns = [
            r'(\d{4})[-_](\d{2})[-_](\d{2})',
            r'(\d{2})[-_](\d{2})[-_](\d{4})'
        ]
        
        for pattern in patterns:
            match = re.search(pattern, filename)
            if match:
                groups = match.groups()
                if len(groups[0]) == 4:
                    return f"{groups[0]}-{groups[1]}-{groups[2]}"
                else:
                    return f"{groups[2]}-{groups[0]}-{groups[1]}"
                    
        return None


class MarieKondoDaemon:
    """Main daemon orchestrator"""
    
    def __init__(self):
        # Configuration
        self.config = {
            "INCOMING_DIR": os.getenv("INCOMING_DIR", "./incoming"),
            "LOCKBOX_DIR": os.getenv("LOCKBOX_DIR", "./lockbox"),
            "DATABASE_URL": os.getenv("DATABASE_URL"),
            "CHITTY_ID": os.getenv("CHITTY_ID", "arias_v_bianchi_2024D007847"),
            "UPDATE_INTERVAL": int(os.getenv("UPDATE_INTERVAL", "300"))
        }
        
        # Initialize components
        self.processor = EvidenceProcessor(self.config)
        self.document_builder = DocumentBuilder(
            Path(self.config["LOCKBOX_DIR"]),
            self.processor.chitty
        )
        
        # Initialize integrations if configured
        if os.getenv("CHITTYCHAIN_API"):
            self.chittychain = ChittyChainIntegration(os.getenv("CHITTYCHAIN_API"))
        else:
            self.chittychain = None
            
        if os.getenv("CHITTYVERIFY_API"):
            self.chittyverify = ChittyVerifyIntegration(os.getenv("CHITTYVERIFY_API"))
        else:
            self.chittyverify = None
            
        if os.getenv("CHITTYTRUST_API"):
            self.chittytrust = ChittyTrustIntegration(os.getenv("CHITTYTRUST_API"))
        else:
            self.chittytrust = None
            
        # File watcher
        self.observer = Observer()
        self.watcher = EvidenceWatcher(self.processor)
        
    def start(self):
        """Start the daemon"""
        logger.info("🌸 Marie Kondo Evidence Daemon starting...")
        logger.info(f"Monitoring: {self.config['INCOMING_DIR']}")
        logger.info(f"Lockbox: {self.config['LOCKBOX_DIR']}")
        
        # Process any existing files
        self.process_existing_files()
        
        # Start file watcher
        self.observer.schedule(
            self.watcher,
            self.config['INCOMING_DIR'],
            recursive=False
        )
        self.observer.start()
        
        # Schedule document builders
        schedule.every(self.config['UPDATE_INTERVAL']).seconds.do(
            self.document_builder.build_timeline
        )
        schedule.every(self.config['UPDATE_INTERVAL']).seconds.do(
            self.document_builder.build_key_documents_index
        )
        schedule.every(self.config['UPDATE_INTERVAL']).seconds.do(
            self.document_builder.build_chain_of_custody_report
        )
        
        # Initial document build
        self.document_builder.build_timeline()
        self.document_builder.build_key_documents_index()
        self.document_builder.build_chain_of_custody_report()
        
        # Main loop
        try:
            while True:
                schedule.run_pending()
                time.sleep(1)
        except KeyboardInterrupt:
            self.stop()
            
    def stop(self):
        """Stop the daemon"""
        logger.info("Stopping daemon...")
        self.observer.stop()
        self.observer.join()
        logger.info("👋 Daemon stopped")
        
    def process_existing_files(self):
        """Process any files already in incoming"""
        incoming_dir = Path(self.config['INCOMING_DIR'])
        incoming_dir.mkdir(exist_ok=True)
        
        for filepath in incoming_dir.iterdir():
            if filepath.is_file() and not filepath.name.startswith('.'):
                self.watcher.process_file(filepath)


if __name__ == "__main__":
    daemon = MarieKondoDaemon()
    daemon.start()