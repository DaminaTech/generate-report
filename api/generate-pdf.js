// api/generate-pdf.js
// Fixed version that properly handles the HTML content

export default async function handler(req, res) {
    console.log("🚀 PDF generation function called");

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
        console.log("📨 Processing POST request");
        console.log("Content-Type:", req.headers["content-type"]);
        console.log("Body type:", typeof req.body);

        // Parse request body properly
        let requestData = {};

        if (req.body) {
            if (typeof req.body === "string") {
                try {
                    requestData = JSON.parse(req.body);
                } catch (e) {
                    console.error("Failed to parse JSON:", e);
                    requestData = { html: req.body }; // Treat as raw HTML
                }
            } else if (typeof req.body === "object") {
                requestData = req.body;
            }
        }

        console.log("📋 Request data keys:", Object.keys(requestData));

        const { html, options = {} } = requestData;

        if (!html || html.trim() === "") {
            console.error("❌ No HTML content provided");
            return res.status(400).json({ error: "HTML content is required" });
        }

        console.log("✅ HTML received, length:", html.length);
        console.log(
            "📄 HTML preview (first 200 chars):",
            html.substring(0, 200)
        );

        try {
            // Import Puppeteer
            const puppeteer = await import("puppeteer-core");
            const chromium = await import("@sparticuz/chromium");

            console.log("📦 Puppeteer imported successfully");

            // Launch browser
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
                waitUntil: "domcontentloaded",
                timeout: 30000,
            });

            console.log("📄 HTML content set in browser");

            // PDF options
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

            console.log("🖨️ Generating PDF with options:", pdfOptions);

            // Generate PDF
            const pdfBuffer = await page.pdf(pdfOptions);

            await browser.close();

            console.log(
                "✅ PDF generated successfully, size:",
                pdfBuffer.length,
                "bytes"
            );

            // Return PDF
            res.setHeader("Content-Type", "application/pdf");
            res.setHeader("Content-Length", pdfBuffer.length);
            res.setHeader(
                "Content-Disposition",
                'attachment; filename="construction-report.pdf"'
            );

            return res.status(200).send(pdfBuffer);
        } catch (puppeteerError) {
            console.error("❌ Puppeteer error:", puppeteerError);

            // Fallback: Create a simple PDF-style HTML that can be saved as PDF
            console.log("📄 Creating PDF-ready HTML fallback");

            const pdfReadyHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        @page { 
            size: A4; 
            margin: 20mm 15mm; 
        }
        body { 
            font-family: Arial, sans-serif; 
            margin: 0; 
            padding: 0;
            line-height: 1.4;
            font-size: 12px;
        }
        .print-ready {
            width: 100%;
            max-width: none;
        }
    </style>
</head>
<body class="print-ready">
${html
    .replace(/<body[^>]*>|<\/body>/gi, "")
    .replace(/<html[^>]*>|<\/html>/gi, "")
    .replace(/<head>.*?<\/head>/gis, "")}
<script>
// Auto-print when opened (optional)
// window.onload = function() { window.print(); }
</script>
</body>
</html>`;

            // Return as downloadable HTML file
            const htmlBuffer = Buffer.from(pdfReadyHtml, "utf8");

            res.setHeader("Content-Type", "application/octet-stream");
            res.setHeader("Content-Length", htmlBuffer.length);
            res.setHeader(
                "Content-Disposition",
                'attachment; filename="construction-report.html"'
            );

            return res.status(200).send(htmlBuffer);
        }
    } catch (error) {
        console.error("❌ General error:", error);
        console.error("Error stack:", error.stack);

        return res.status(500).json({
            error: "PDF generation failed",
            message: error.message,
            details: error.stack,
        });
    }
}
