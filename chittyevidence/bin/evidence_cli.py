#!/usr/bin/env python3
"""
Marie Kondo Evidence System - Command Line Interface
====================================================
CLI for manual evidence operations and status checking
"""

import os
import sys
import argparse
from pathlib import Path
from datetime import datetime
from dotenv import load_dotenv

# Add lib to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'lib'))
from evidence_core import EvidenceProcessor, ChittyIntegration

# Load environment variables
load_dotenv(Path(__file__).parent.parent / 'config' / '.env')

def main():
    parser = argparse.ArgumentParser(description='Marie Kondo Evidence System CLI')
    subparsers = parser.add_subparsers(dest='command', help='Available commands')
    
    # Process command
    process_parser = subparsers.add_parser('process', help='Process a specific file')
    process_parser.add_argument('file', help='File to process')
    
    # Search command
    search_parser = subparsers.add_parser('search', help='Search evidence')
    search_parser.add_argument('--category', help='Filter by category')
    search_parser.add_argument('--tag', help='Filter by tag')
    search_parser.add_argument('--from-date', help='From date (YYYY-MM-DD)')
    search_parser.add_argument('--to-date', help='To date (YYYY-MM-DD)')
    
    # Status command
    status_parser = subparsers.add_parser('status', help='Show system status')
    
    # Chain command
    chain_parser = subparsers.add_parser('chain', help='Show chain of custody')
    chain_parser.add_argument('hash', help='File hash')
    
    # Stats command
    stats_parser = subparsers.add_parser('stats', help='Show evidence statistics')
    
    args = parser.parse_args()
    
    if not args.command:
        parser.print_help()
        return
        
    # Initialize processor
    config = {
        "INCOMING_DIR": os.getenv("INCOMING_DIR", "./incoming"),
        "LOCKBOX_DIR": os.getenv("LOCKBOX_DIR", "./lockbox"),
        "DATABASE_URL": os.getenv("DATABASE_URL"),
        "CHITTY_ID": os.getenv("CHITTY_ID", "arias_v_bianchi_2024D007847")
    }
    
    processor = EvidenceProcessor(config)
    
    if args.command == 'process':
        file_path = Path(args.file)
        if not file_path.exists():
            print(f"❌ File not found: {args.file}")
            return
            
        result = processor.process_evidence(file_path)
        if result:
            print(f"✅ Processed: {result['exhibit_id']}")
            print(f"   Category: {result['category']}")
            print(f"   Hash: {result['hash'][:16]}...")
        else:
            print("⚠️ File already processed or duplicate")
            
    elif args.command == 'search':
        query = {}
        if args.category:
            query['category'] = args.category
        if args.tag:
            query['tags'] = [args.tag]
        if args.from_date:
            query['date_from'] = args.from_date
        if args.to_date:
            query['date_to'] = args.to_date
            
        results = processor.chitty.search_evidence(query)
        
        print(f"📋 Found {len(results)} evidence items:")
        for item in results:
            print(f"   {item['exhibit_id']} - {item['original_name']}")
            print(f"      Category: {item['category']}")
            print(f"      Created: {item['created_at']}")
            print()
            
    elif args.command == 'status':
        # Get counts by category
        all_evidence = processor.chitty.search_evidence({})
        
        by_category = {}
        for item in all_evidence:
            cat = item['category']
            by_category[cat] = by_category.get(cat, 0) + 1
            
        print("📊 Evidence System Status")
        print("=" * 40)
        print(f"Total Evidence Items: {len(all_evidence)}")
        print(f"Case ID: {config['CHITTY_ID']}")
        print(f"Last Updated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print()
        print("Evidence by Category:")
        for category, count in sorted(by_category.items()):
            print(f"   {category}: {count} items")
            
    elif args.command == 'chain':
        events = processor.chitty.get_evidence_chain(args.hash)
        
        print(f"🔗 Chain of Custody for {args.hash[:16]}...")
        print("=" * 50)
        
        for event in events:
            print(f"{event['timestamp']} - {event['event_type']}")
            if event['event_data']:
                for key, value in event['event_data'].items():
                    print(f"   {key}: {value}")
            print()
            
    elif args.command == 'stats':
        all_evidence = processor.chitty.search_evidence({})
        
        # Basic stats
        total_files = len(all_evidence)
        categories = set(item['category'] for item in all_evidence)
        
        # Date range
        dates = [item['created_at'] for item in all_evidence if item['created_at']]
        if dates:
            first_date = min(dates)
            last_date = max(dates)
        else:
            first_date = last_date = "N/A"
            
        print("📈 Evidence Statistics")
        print("=" * 30)
        print(f"Total Files: {total_files}")
        print(f"Categories: {len(categories)}")
        print(f"Date Range: {first_date} to {last_date}")
        print()
        
        # Top categories
        by_category = {}
        for item in all_evidence:
            cat = item['category']
            by_category[cat] = by_category.get(cat, 0) + 1
            
        print("Top Categories:")
        for category, count in sorted(by_category.items(), key=lambda x: x[1], reverse=True)[:5]:
            print(f"   {category}: {count} files")

if __name__ == "__main__":
    main()