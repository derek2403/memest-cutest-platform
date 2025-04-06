import { TappdClient } from '@phala/dstack-sdk';

(async () => {
  try {
    // Read custom data from the command-line argument
    const userData = process.argv[2] || "default-user-data";
    
    const client = new TappdClient();
    await client.info();
    
    // Generate a TDX quote using the provided custom data and SHA256.
    const quoteResult = await client.tdxQuote(userData, 'sha256');
    
    // Build the RA report.
    const raReport = {
      quote: quoteResult.quote,         // TDX quote in hex format
      event_log: quoteResult.event_log,   // Attestation event log
      rtmrs: quoteResult.replayRtmrs()      // Runtime measurement registers
    };

    // Output the RA report as JSON.
    console.log(JSON.stringify(raReport));
  } catch (err) {
    console.error("Error generating RA report:", err);
    process.exit(1);
  }
})(); 