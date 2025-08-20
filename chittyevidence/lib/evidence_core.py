"""
Marie Kondo Evidence System - Core Library
Integrates with ChittyID and ChittyLedger for blockchain evidence management
"""

import os
import hashlib
import json
import logging
import shutil
from datetime import datetime
from pathlib import Path
import psycopg2
from psycopg2.extras import RealDictCursor
import requests
from typing import Dict, List, Optional, Tuple
from chitty_integrations import ChittyPlatformManager

class ChittyIntegration:
    """Integration with ChittyID and ChittyLedger"""
    
    def __init__(self, database_url: str, chitty_id: str):
        self.database_url = database_url
        self.chitty_id = chitty_id
        self.conn = None
        self.connect()
        
    def connect(self):
        """Connect to Neon PostgreSQL"""
        try:
            self.conn = psycopg2.connect(self.database_url)
            logging.info("Connected to ChittyLedger database")
        except Exception as e:
            logging.error(f"Database connection failed: {e}")
            
    def create_evidence_tables(self):
        """Create evidence tracking tables if they don't exist"""
        with self.conn.cursor() as cur:
            cur.execute("""
                CREATE TABLE IF NOT EXISTS evidence_registry (
                    id SERIAL PRIMARY KEY,
                    chitty_id VARCHAR(255) NOT NULL,
                    file_hash VARCHAR(64) UNIQUE NOT NULL,
                    original_name TEXT NOT NULL,
                    exhibit_id VARCHAR(255),
                    category VARCHAR(50),
                    tags JSONB DEFAULT '[]',
                    metadata JSONB DEFAULT '{}',
                    chain_of_custody JSONB DEFAULT '[]',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
                
                CREATE TABLE IF NOT EXISTS evidence_relationships (
                    id SERIAL PRIMARY KEY,
                    chitty_id VARCHAR(255) NOT NULL,
                    parent_hash VARCHAR(64) NOT NULL,
                    child_hash VARCHAR(64) NOT NULL,
                    relationship_type VARCHAR(50),
                    metadata JSONB DEFAULT '{}',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (parent_hash) REFERENCES evidence_registry(file_hash),
                    FOREIGN KEY (child_hash) REFERENCES evidence_registry(file_hash)
                );
                
                CREATE TABLE IF NOT EXISTS evidence_events (
                    id SERIAL PRIMARY KEY,
                    chitty_id VARCHAR(255) NOT NULL,
                    file_hash VARCHAR(64) NOT NULL,
                    event_type VARCHAR(50) NOT NULL,
                    event_data JSONB NOT NULL,
                    user_id VARCHAR(255),
                    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (file_hash) REFERENCES evidence_registry(file_hash)
                );
                
                CREATE INDEX IF NOT EXISTS idx_evidence_chitty_id ON evidence_registry(chitty_id);
                CREATE INDEX IF NOT EXISTS idx_evidence_category ON evidence_registry(category);
                CREATE INDEX IF NOT EXISTS idx_evidence_tags ON evidence_registry USING GIN(tags);
                CREATE INDEX IF NOT EXISTS idx_events_timestamp ON evidence_events(timestamp);
            """)
            self.conn.commit()
            logging.info("Evidence tables initialized")
            
    def register_evidence(self, file_hash: str, original_name: str, 
                         exhibit_id: str, category: str, metadata: dict = None) -> int:
        """Register evidence in ChittyLedger"""
        with self.conn.cursor() as cur:
            cur.execute("""
                INSERT INTO evidence_registry 
                (chitty_id, file_hash, original_name, exhibit_id, category, metadata)
                VALUES (%s, %s, %s, %s, %s, %s)
                ON CONFLICT (file_hash) 
                DO UPDATE SET 
                    exhibit_id = EXCLUDED.exhibit_id,
                    category = EXCLUDED.category,
                    updated_at = CURRENT_TIMESTAMP
                RETURNING id
            """, (
                self.chitty_id,
                file_hash,
                original_name,
                exhibit_id,
                category,
                json.dumps(metadata or {})
            ))
            
            evidence_id = cur.fetchone()[0]
            
            # Log the registration event
            self.log_event(file_hash, "registered", {
                "exhibit_id": exhibit_id,
                "category": category
            })
            
            self.conn.commit()
            return evidence_id
            
    def log_event(self, file_hash: str, event_type: str, event_data: dict):
        """Log an evidence event"""
        with self.conn.cursor() as cur:
            cur.execute("""
                INSERT INTO evidence_events 
                (chitty_id, file_hash, event_type, event_data)
                VALUES (%s, %s, %s, %s)
            """, (
                self.chitty_id,
                file_hash,
                event_type,
                json.dumps(event_data)
            ))
            self.conn.commit()
            
    def add_tags(self, file_hash: str, tags: List[str]):
        """Add tags to evidence"""
        with self.conn.cursor() as cur:
            cur.execute("""
                UPDATE evidence_registry 
                SET tags = tags || %s::jsonb,
                    updated_at = CURRENT_TIMESTAMP
                WHERE file_hash = %s
            """, (json.dumps(tags), file_hash))
            
            self.log_event(file_hash, "tags_added", {"tags": tags})
            self.conn.commit()
            
    def create_relationship(self, parent_hash: str, child_hash: str, 
                          relationship_type: str, metadata: dict = None):
        """Create relationship between evidence items"""
        with self.conn.cursor() as cur:
            cur.execute("""
                INSERT INTO evidence_relationships
                (chitty_id, parent_hash, child_hash, relationship_type, metadata)
                VALUES (%s, %s, %s, %s, %s)
            """, (
                self.chitty_id,
                parent_hash,
                child_hash,
                relationship_type,
                json.dumps(metadata or {})
            ))
            self.conn.commit()
            
    def get_evidence_chain(self, file_hash: str) -> List[dict]:
        """Get complete chain of custody for evidence"""
        with self.conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("""
                SELECT * FROM evidence_events
                WHERE file_hash = %s
                ORDER BY timestamp ASC
            """, (file_hash,))
            return cur.fetchall()
            
    def search_evidence(self, query: dict) -> List[dict]:
        """Search evidence by various criteria"""
        with self.conn.cursor(cursor_factory=RealDictCursor) as cur:
            conditions = ["chitty_id = %s"]
            params = [self.chitty_id]
            
            if "category" in query:
                conditions.append("category = %s")
                params.append(query["category"])
                
            if "tags" in query:
                conditions.append("tags @> %s::jsonb")
                params.append(json.dumps(query["tags"]))
                
            if "date_from" in query:
                conditions.append("created_at >= %s")
                params.append(query["date_from"])
                
            if "date_to" in query:
                conditions.append("created_at <= %s")
                params.append(query["date_to"])
                
            where_clause = " AND ".join(conditions)
            
            cur.execute(f"""
                SELECT * FROM evidence_registry
                WHERE {where_clause}
                ORDER BY created_at DESC
            """, params)
            
            return cur.fetchall()


class EvidenceProcessor:
    """Core evidence processing with ChittyLedger integration"""
    
    def __init__(self, config: dict):
        self.config = config
        self.lockbox_dir = Path(config["LOCKBOX_DIR"])
        self.originals_dir = self.lockbox_dir / ".originals"
        self.originals_dir.mkdir(exist_ok=True)
        
        # Initialize ChittyLedger integration
        self.chitty = ChittyIntegration(
            config["DATABASE_URL"],
            config["CHITTY_ID"]
        )
        self.chitty.create_evidence_tables()
        
        # Initialize Chitty Platform Manager for additional services
        self.chitty_platform = ChittyPlatformManager(config)
        
        # Categories with enhanced metadata
        self.categories = {
            "01_TRO_PROCEEDINGS": {
                "name": "TRO Proceedings",
                "tags": ["tro", "emergency", "court-order"],
                "date_filter": lambda d: d >= "2024-10-30"
            },
            "02_LLC_FORMATION": {
                "name": "LLC Formation",
                "tags": ["corporate", "formation", "aribia"],
                "priority_keywords": ["operating agreement", "articles"]
            },
            "03_MEMBERSHIP_REMOVAL": {
                "name": "Membership Removal",
                "tags": ["membership", "removal", "unanimous-consent"],
                "date_filter": lambda d: "2024-10-01" <= d <= "2024-10-31"
            },
            "04_PREMARITAL_FUNDING": {
                "name": "Pre-marital Funding",
                "tags": ["premarital", "separate-property", "funding"]
            },
            "05_PROPERTY_TRANSACTIONS": {
                "name": "Property Transactions",
                "tags": ["property", "real-estate", "deed", "mortgage"]
            },
            "06_FINANCIAL_STATEMENTS": {
                "name": "Financial Statements",
                "tags": ["financial", "bank-statement", "account"]
            },
            "07_COURT_FILINGS": {
                "name": "Court Filings",
                "tags": ["court", "filing", "motion", "petition"]
            },
            "08_ATTORNEY_CORRESPONDENCE": {
                "name": "Attorney Correspondence",
                "tags": ["attorney", "legal", "correspondence"]
            },
            "09_PERJURY_EVIDENCE": {
                "name": "Perjury Evidence",
                "tags": ["perjury", "false-statement", "fraud"]
            },
            "10_SANCTIONS_RULE137": {
                "name": "Rule 137 Sanctions",
                "tags": ["sanctions", "rule-137", "frivolous"]
            },
            "11_COLOMBIAN_PROPERTY": {
                "name": "Colombian Property",
                "tags": ["colombia", "morada-mami", "international"]
            },
            "12_LEASE_AGREEMENTS": {
                "name": "Lease Agreements",
                "tags": ["lease", "rental", "tenant"]
            }
        }
        
    def process_evidence(self, filepath: Path) -> Optional[dict]:
        """Process evidence file with full ChittyLedger integration"""
        # Calculate hash
        file_hash = self.calculate_hash(filepath)
        
        # Check if already registered
        existing = self.chitty.search_evidence({"file_hash": file_hash})
        if existing:
            return None
            
        # Categorize
        category, score, tags = self.categorize_enhanced(filepath)
        
        # Generate exhibit ID
        exhibit_id = self.generate_exhibit_id(filepath, category)
        
        # Move to originals
        orig_path = self.originals_dir / f"{file_hash[:8]}_{filepath.name}"
        filepath.rename(orig_path)
        
        # Create symlink
        cat_dir = self.lockbox_dir / category
        cat_dir.mkdir(exist_ok=True)
        symlink_path = cat_dir / exhibit_id
        
        try:
            os.symlink(
                os.path.relpath(orig_path, cat_dir),
                symlink_path
            )
        except:
            shutil.copy2(orig_path, symlink_path)
            
        # Register in ChittyLedger
        metadata = {
            "score": score,
            "file_size": orig_path.stat().st_size,
            "mime_type": self.get_mime_type(orig_path),
            "processed_at": datetime.now().isoformat(),
            "case_id": self.config["CHITTY_ID"],
            "exhibit_id": exhibit_id,
            "category": category
        }
        
        # Run comprehensive Chitty Platform analysis if services are available
        if any([self.chitty_platform.chitty_verify, self.chitty_platform.chitty_trust, self.chitty_platform.chitty_chain]):
            logging.info(f"Running comprehensive Chitty Platform analysis for {exhibit_id}")
            platform_results = self.chitty_platform.process_evidence_comprehensive(str(orig_path), metadata)
            metadata["platform_analysis"] = platform_results["services"]
        
        evidence_id = self.chitty.register_evidence(
            file_hash,
            filepath.name,
            exhibit_id,
            category,
            metadata
        )
        
        # Add tags
        all_tags = tags + self.categories[category]["tags"]
        self.chitty.add_tags(file_hash, all_tags)
        
        # Create relationships if applicable
        self.detect_relationships(file_hash, filepath.name)
        
        return {
            "id": evidence_id,
            "hash": file_hash,
            "exhibit_id": exhibit_id,
            "category": category,
            "tags": all_tags
        }
        
    def calculate_hash(self, filepath: Path) -> str:
        """Calculate SHA256 hash"""
        sha256_hash = hashlib.sha256()
        with open(filepath, "rb") as f:
            for byte_block in iter(lambda: f.read(4096), b""):
                sha256_hash.update(byte_block)
        return sha256_hash.hexdigest()
        
    def categorize_enhanced(self, filepath: Path) -> Tuple[str, int, List[str]]:
        """Enhanced categorization with tag extraction"""
        filename = filepath.name.lower()
        
        # Extract additional tags from filename
        tags = []
        
        # Date tags
        import re
        date_match = re.search(r'(\d{4}[-_]\d{2}[-_]\d{2})', filename)
        if date_match:
            tags.append(f"date:{date_match.group(1)}")
            
        # Common legal terms
        legal_terms = ["affidavit", "exhibit", "deposition", "transcript", 
                      "order", "motion", "petition", "response"]
        for term in legal_terms:
            if term in filename:
                tags.append(term)
                
        # Categorize (simplified for example)
        category = "99_UNSORTED"
        score = 0
        
        # Check each category
        for cat_id, cat_info in self.categories.items():
            cat_score = 0
            
            # Match based on tags
            for tag in cat_info["tags"]:
                if tag.replace("-", " ") in filename:
                    cat_score += 5
                    
            if cat_score > score:
                score = cat_score
                category = cat_id
                
        return category, score, tags
        
    def generate_exhibit_id(self, filepath: Path, category: str) -> str:
        """Generate exhibit ID"""
        # Get next number for category
        cat_dir = self.lockbox_dir / category
        existing = list(cat_dir.glob("EX*"))
        next_num = len(existing) + 1
        
        # Extract date
        import re
        date_match = re.search(r'(\d{4})[-_](\d{2})[-_](\d{2})', filepath.name)
        if date_match:
            date_str = f"{date_match.group(1)}{date_match.group(2)}{date_match.group(3)}"
        else:
            date_str = "UNDATED"
            
        # Clean name
        clean_name = re.sub(r'[^\w\s-]', '', filepath.stem)[:30]
        clean_name = re.sub(r'\s+', '_', clean_name)
        
        return f"EX{next_num:03d}_{date_str}_{clean_name}{filepath.suffix}"
        
    def detect_relationships(self, file_hash: str, filename: str):
        """Detect relationships between evidence items"""
        # Look for response/reply patterns
        if "response to" in filename.lower():
            # Find parent document
            search_term = filename.lower().split("response to")[-1].strip()
            related = self.chitty.search_evidence({"query": search_term})
            
            if related:
                self.chitty.create_relationship(
                    related[0]["file_hash"],
                    file_hash,
                    "response",
                    {"detected_from": "filename"}
                )
                
    def get_mime_type(self, filepath: Path) -> str:
        """Get MIME type of file"""
        import mimetypes
        mime_type, _ = mimetypes.guess_type(str(filepath))
        return mime_type or "application/octet-stream"