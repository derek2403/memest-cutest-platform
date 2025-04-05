#!/usr/bin/env python3
import subprocess
import json
import sys
import os

def get_attestation_report(user_data="default-user-data"):
    """
    Generate attestation report by calling the JavaScript Node.js script
    
    Args:
        user_data: Custom data to include in the attestation report
        
    Returns:
        Dictionary containing the attestation report
    """
    try:
        # Call the Node.js script with proper ES Module flags
        result = subprocess.run(
            ["node", "--experimental-json-modules", "--experimental-modules", "generate_ra.js", user_data],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            check=True,
            text=True,
            env={**os.environ, "NODE_OPTIONS": "--no-warnings --experimental-specifier-resolution=node"}
        )
        
        # Parse the JSON output
        ra_report = json.loads(result.stdout)
        return {
            "success": True,
            "ra_report": ra_report,
            "custom_data_used": user_data
        }
    except subprocess.CalledProcessError as e:
        print(f"Error executing Node.js script: {e.stderr}", file=sys.stderr)
        return {
            "success": False,
            "error": "Error generating RA report",
            "details": e.stderr
        }
    except json.JSONDecodeError as je:
        print(f"JSON decode error: {je}", file=sys.stderr)
        return {
            "success": False,
            "error": "Invalid JSON returned from Node script",
            "details": str(je)
        }

if __name__ == "__main__":
    # Get user data from command line arguments if provided
    user_data = sys.argv[1] if len(sys.argv) > 1 else "default-user-data"
    
    # Get the attestation report
    report = get_attestation_report(user_data)
    
    # Print the result as JSON
    print(json.dumps(report, indent=2)) 