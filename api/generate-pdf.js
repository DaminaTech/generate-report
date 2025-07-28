// api/generate-pdf.js
// Ultra-simple version without Puppeteer for now

export default async function handler(req, res) {
    console.log("🚀 Function called");

    // CORS headers
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
        return res.status(200).end();
    }

    if (req.method === "GET") {
        return res.status(200).json({
            message: "PDF service is running!",
            timestamp: new Date().toISOString(),
        });
    }

    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    try {
        console.log("📨 POST request received");
        console.log("Headers:", JSON.stringify(req.headers));
        console.log("Body type:", typeof req.body);
        console.log("Body:", req.body);

        // Parse request body
        let requestData;

        if (typeof req.body === "string") {
            requestData = JSON.parse(req.body);
        } else {
            requestData = req.body || {};
        }

        const {
            html = "<html><body><h1>No HTML provided</h1></body></html>",
            options = {},
        } = requestData;

        console.log("✅ HTML received, length:", html.length);

        // For now, create a simple text response instead of PDF
        // This eliminates Puppeteer as the source of errors

        const textContent = `
CONSTRUCTION WORK REPORT
========================

Generated: ${new Date().toISOString()}
HTML Content Length: ${html.length} characters

Raw HTML (first 500 chars):
${html.substring(0, 500)}

Options: ${JSON.stringify(options, null, 2)}

This is a temporary text version while we debug the PDF generation.
    `;

        // Return as plain text for now
        res.setHeader("Content-Type", "text/plain");
        res.setHeader(
            "Content-Disposition",
            'attachment; filename="report.txt"'
        );

        return res.status(200).send(textContent);
    } catch (error) {
        console.error("❌ Error in function:", error);
        console.error("Error stack:", error.stack);

        return res.status(500).json({
            error: "Function error",
            message: error.message,
            stack: error.stack,
        });
    }
}
