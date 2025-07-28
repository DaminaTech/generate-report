// api/generate-pdf.js
// Simplified Vercel function to convert HTML to PDF

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
        return res.status(200).end();
    }

    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    try {
        console.log("📨 Received request method:", req.method);
        console.log("📨 Request headers:", req.headers);
        console.log("📨 Raw body:", req.body);

        // Handle different body parsing scenarios
        let requestData;

        if (typeof req.body === "string") {
            try {
                requestData = JSON.parse(req.body);
            } catch (e) {
                console.error("Failed to parse JSON body:", e);
                return res
                    .status(400)
                    .json({ error: "Invalid JSON in request body" });
            }
        } else if (req.body && typeof req.body === "object") {
            requestData = req.body;
        } else {
            console.error("No body found in request");
            return res.status(400).json({ error: "No request body found" });
        }

        console.log("📨 Parsed request data:", requestData);

        const { html, options = {} } = requestData;

        if (!html) {
            console.error("❌ No HTML content provided");
            return res.status(400).json({ error: "HTML content is required" });
        }

        console.log("🚀 Starting PDF generation...");
        console.log("HTML length:", html.length);

        // Import puppeteer dynamically
        const puppeteer = await import("puppeteer-core");
        const chromium = await import("@sparticuz/chromium");

        console.log("📦 Puppeteer imported successfully");

        // Configure Puppeteer for Vercel
        const browser = await puppeteer.default.launch({
            args: [
                ...chromium.default.args,
                "--hide-scrollbars",
                "--disable-web-security",
            ],
            defaultViewport: chromium.default.defaultViewport,
            executablePath: await chromium.default.executablePath(),
            headless: chromium.default.headless,
            ignoreHTTPSErrors: true,
        });

        console.log("🌐 Browser launched");

        const page = await browser.newPage();

        // Set HTML content
        await page.setContent(html, {
            waitUntil: "networkidle0",
            timeout: 30000,
        });

        console.log("📄 HTML content set");

        // PDF options with defaults
        const pdfOptions = {
            format: options.format || "A4",
            margin: options.margin || {
                top: "20mm",
                bottom: "20mm",
                left: "15mm",
                right: "15mm",
            },
            printBackground: true,
            preferCSSPageSize: true,
        };

        console.log("📄 Generating PDF with options:", pdfOptions);

        // Generate PDF
        const pdfBuffer = await page.pdf(pdfOptions);

        await browser.close();

        console.log("✅ PDF generated successfully, size:", pdfBuffer.length);

        // Return PDF as response
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Length", pdfBuffer.length);
        res.setHeader(
            "Content-Disposition",
            'attachment; filename="report.pdf"'
        );

        return res.status(200).send(pdfBuffer);
    } catch (error) {
        console.error("❌ PDF generation failed:", error);
        console.error("Error stack:", error.stack);

        return res.status(500).json({
            error: "PDF generation failed",
            details: error.message,
            stack:
                process.env.NODE_ENV === "development"
                    ? error.stack
                    : undefined,
        });
    }
}
