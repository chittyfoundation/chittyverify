"""
Marie Kondo Evidence System - Chitty Platform Integrations
==========================================================
Enhanced integrations with ChittyChain, ChittyVerify, ChittyTrust, and ChittyID
"""

import os
import json
import hashlib
import requests
import logging
from datetime import datetime
from typing import Dict, Optional, List

logger = logging.getLogger(__name__)

class ChittyIDIntegration:
    """Integration with ChittyID for identity verification and management"""
    
    def __init__(self, api_endpoint: str, api_key: str):
        self.api_endpoint = api_endpoint
        self.api_key = api_key
        self.headers = {
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json'
        }
        
    def verify_case_identity(self, case_id: str) -> Dict:
        """Verify case identity and permissions"""
        try:
            response = requests.get(
                f"{self.api_endpoint}/identity/case/{case_id}",
                headers=self.headers
            )
            if response.status_code == 200:
                return response.json()
        except Exception as e:
            logger.error(f"ChittyID verification failed: {e}")
        return {"verified": False, "error": "Verification failed"}
        
    def register_case_participant(self, case_id: str, participant_data: Dict) -> str:
        """Register case participant identity"""
        try:
            response = requests.post(
                f"{self.api_endpoint}/identity/participant",
                headers=self.headers,
                json={
                    "case_id": case_id,
                    "participant": participant_data,
                    "timestamp": datetime.now().isoformat()
                }
            )
            if response.status_code == 201:
                return response.json()["participant_id"]
        except Exception as e:
            logger.error(f"ChittyID participant registration failed: {e}")
        return None

class ChittyChainIntegration:
    """Enhanced integration with ChittyChain for immutable evidence storage"""
    
    def __init__(self, api_endpoint: str, api_key: str):
        self.api_endpoint = api_endpoint
        self.api_key = api_key
        self.headers = {
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json'
        }
        
    def store_evidence_hash(self, file_hash: str, metadata: Dict) -> Optional[str]:
        """Store evidence hash on ChittyChain with enhanced metadata"""
        try:
            payload = {
                "evidence_hash": file_hash,
                "metadata": {
                    **metadata,
                    "stored_at": datetime.now().isoformat(),
                    "chain_version": "v2.0",
                    "evidence_type": "legal_document"
                },
                "case_id": metadata.get("case_id"),
                "exhibit_id": metadata.get("exhibit_id")
            }
            
            response = requests.post(
                f"{self.api_endpoint}/evidence/store",
                headers=self.headers,
                json=payload
            )
            
            if response.status_code == 201:
                result = response.json()
                return result["transaction_id"]
                
        except Exception as e:
            logger.error(f"ChittyChain storage failed: {e}")
        return None
        
    def verify_evidence_integrity(self, file_hash: str) -> Dict:
        """Verify evidence integrity on blockchain"""
        try:
            response = requests.get(
                f"{self.api_endpoint}/evidence/verify/{file_hash}",
                headers=self.headers
            )
            if response.status_code == 200:
                return response.json()
        except Exception as e:
            logger.error(f"ChittyChain verification failed: {e}")
        return {"verified": False, "error": str(e)}
        
    def get_evidence_timeline(self, file_hash: str) -> List[Dict]:
        """Get complete blockchain timeline for evidence"""
        try:
            response = requests.get(
                f"{self.api_endpoint}/evidence/timeline/{file_hash}",
                headers=self.headers
            )
            if response.status_code == 200:
                return response.json()["timeline"]
        except Exception as e:
            logger.error(f"ChittyChain timeline retrieval failed: {e}")
        return []

class ChittyVerifyIntegration:
    """Enhanced integration with ChittyVerify for document authenticity"""
    
    def __init__(self, api_endpoint: str, api_key: str):
        self.api_endpoint = api_endpoint
        self.api_key = api_key
        self.headers = {
            'Authorization': f'Bearer {api_key}'
        }
        
    def verify_document_authenticity(self, file_path: str, metadata: Dict = None) -> Dict:
        """Comprehensive document verification"""
        try:
            with open(file_path, 'rb') as f:
                files = {'document': f}
                data = {
                    'metadata': json.dumps(metadata or {}),
                    'verification_type': 'comprehensive',
                    'include_ocr': 'true',
                    'check_tampering': 'true'
                }
                
                response = requests.post(
                    f"{self.api_endpoint}/verify/comprehensive",
                    headers={'Authorization': self.headers['Authorization']},
                    files=files,
                    data=data
                )
                
            if response.status_code == 200:
                return response.json()
                
        except Exception as e:
            logger.error(f"ChittyVerify comprehensive verification failed: {e}")
        return {
            "verified": False, 
            "authenticity_score": 0.0,
            "tampering_detected": True,
            "error": str(e) if 'e' in locals() else "Verification failed"
        }
        
    def extract_document_metadata(self, file_path: str) -> Dict:
        """Extract metadata from document"""
        try:
            with open(file_path, 'rb') as f:
                response = requests.post(
                    f"{self.api_endpoint}/extract/metadata",
                    headers={'Authorization': self.headers['Authorization']},
                    files={'document': f}
                )
                
            if response.status_code == 200:
                return response.json()
                
        except Exception as e:
            logger.error(f"ChittyVerify metadata extraction failed: {e}")
        return {}
        
    def perform_ocr_analysis(self, file_path: str) -> Dict:
        """Perform OCR and text analysis"""
        try:
            with open(file_path, 'rb') as f:
                response = requests.post(
                    f"{self.api_endpoint}/ocr/analyze",
                    headers={'Authorization': self.headers['Authorization']},
                    files={'document': f},
                    data={'include_confidence': 'true'}
                )
                
            if response.status_code == 200:
                return response.json()
                
        except Exception as e:
            logger.error(f"ChittyVerify OCR analysis failed: {e}")
        return {"text": "", "confidence": 0.0}

class ChittyTrustIntegration:
    """Enhanced integration with ChittyTrust for evidence reliability scoring"""
    
    def __init__(self, api_endpoint: str, api_key: str):
        self.api_endpoint = api_endpoint
        self.api_key = api_key
        self.headers = {
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json'
        }
        
    def calculate_evidence_trust_score(self, evidence_data: Dict) -> Dict:
        """Calculate comprehensive trust score for evidence"""
        try:
            payload = {
                "evidence": evidence_data,
                "factors": [
                    "source_reliability",
                    "chain_of_custody",
                    "document_authenticity", 
                    "temporal_consistency",
                    "cross_reference_validation"
                ],
                "case_context": evidence_data.get("case_context", {}),
                "timestamp": datetime.now().isoformat()
            }
            
            response = requests.post(
                f"{self.api_endpoint}/trust/evidence/calculate",
                headers=self.headers,
                json=payload
            )
            
            if response.status_code == 200:
                return response.json()
                
        except Exception as e:
            logger.error(f"ChittyTrust scoring failed: {e}")
        return {
            "trust_score": 0.0,
            "confidence": 0.0,
            "factors": {},
            "warnings": ["Scoring service unavailable"]
        }
        
    def validate_evidence_relationships(self, evidence_set: List[Dict]) -> Dict:
        """Validate trust relationships between evidence items"""
        try:
            response = requests.post(
                f"{self.api_endpoint}/trust/relationships/validate",
                headers=self.headers,
                json={
                    "evidence_set": evidence_set,
                    "validation_type": "comprehensive"
                }
            )
            
            if response.status_code == 200:
                return response.json()
                
        except Exception as e:
            logger.error(f"ChittyTrust relationship validation failed: {e}")
        return {"validated": False, "inconsistencies": []}
        
    def get_case_trust_metrics(self, case_id: str) -> Dict:
        """Get overall trust metrics for the case"""
        try:
            response = requests.get(
                f"{self.api_endpoint}/trust/case/{case_id}/metrics",
                headers=self.headers
            )
            
            if response.status_code == 200:
                return response.json()
                
        except Exception as e:
            logger.error(f"ChittyTrust case metrics failed: {e}")
        return {"overall_trust": 0.0, "evidence_count": 0}

class ChittyPlatformManager:
    """Unified manager for all Chitty platform integrations"""
    
    def __init__(self, config: Dict):
        # Initialize all integrations if configured
        self.chitty_id = None
        self.chitty_chain = None
        self.chitty_verify = None
        self.chitty_trust = None
        
        if config.get("CHITTYID_API") and config.get("CHITTYID_API_KEY"):
            self.chitty_id = ChittyIDIntegration(
                config["CHITTYID_API"],
                config["CHITTYID_API_KEY"]
            )
            
        if config.get("CHITTYCHAIN_API") and config.get("CHITTYCHAIN_API_KEY"):
            self.chitty_chain = ChittyChainIntegration(
                config["CHITTYCHAIN_API"],
                config["CHITTYCHAIN_API_KEY"]
            )
            
        if config.get("CHITTYVERIFY_API") and config.get("CHITTYVERIFY_API_KEY"):
            self.chitty_verify = ChittyVerifyIntegration(
                config["CHITTYVERIFY_API"],
                config["CHITTYVERIFY_API_KEY"]
            )
            
        if config.get("CHITTYTRUST_API") and config.get("CHITTYTRUST_API_KEY"):
            self.chitty_trust = ChittyTrustIntegration(
                config["CHITTYTRUST_API"],
                config["CHITTYTRUST_API_KEY"]
            )
            
    def process_evidence_comprehensive(self, file_path: str, metadata: Dict) -> Dict:
        """Comprehensive evidence processing using all available Chitty services"""
        results = {
            "file_path": file_path,
            "processed_at": datetime.now().isoformat(),
            "services": {}
        }
        
        # Document verification
        if self.chitty_verify:
            logger.info("Running ChittyVerify analysis...")
            verification = self.chitty_verify.verify_document_authenticity(file_path, metadata)
            ocr_data = self.chitty_verify.perform_ocr_analysis(file_path)
            doc_metadata = self.chitty_verify.extract_document_metadata(file_path)
            
            results["services"]["chitty_verify"] = {
                "verification": verification,
                "ocr": ocr_data,
                "metadata": doc_metadata
            }
            
        # Trust scoring
        if self.chitty_trust:
            logger.info("Calculating trust score...")
            evidence_data = {
                **metadata,
                "verification_results": results["services"].get("chitty_verify", {})
            }
            trust_score = self.chitty_trust.calculate_evidence_trust_score(evidence_data)
            results["services"]["chitty_trust"] = trust_score
            
        # Blockchain storage
        if self.chitty_chain:
            logger.info("Storing on ChittyChain...")
            # Calculate file hash
            with open(file_path, 'rb') as f:
                file_hash = hashlib.sha256(f.read()).hexdigest()
                
            chain_metadata = {
                **metadata,
                "trust_score": results["services"].get("chitty_trust", {}).get("trust_score", 0.0),
                "verification_passed": results["services"].get("chitty_verify", {}).get("verification", {}).get("verified", False)
            }
            
            transaction_id = self.chitty_chain.store_evidence_hash(file_hash, chain_metadata)
            results["services"]["chitty_chain"] = {
                "transaction_id": transaction_id,
                "file_hash": file_hash
            }
            
        return results
        
    def get_service_status(self) -> Dict:
        """Get status of all Chitty services"""
        return {
            "chitty_id_available": self.chitty_id is not None,
            "chitty_chain_available": self.chitty_chain is not None,
            "chitty_verify_available": self.chitty_verify is not None,
            "chitty_trust_available": self.chitty_trust is not None
        }