// api/generate-pdf.js
// Vercel function to convert HTML to PDF using Puppeteer

import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    try {
        const { html, options = {} } = req.body;

        if (!html) {
            return res.status(400).json({ error: "HTML content is required" });
        }

        console.log("🚀 Starting PDF generation...");

        // Configure Puppeteer for Vercel
        const browser = await puppeteer.launch({
            args: chromium.args,
            defaultViewport: chromium.defaultViewport,
            executablePath: await chromium.executablePath(),
            headless: chromium.headless,
            ignoreHTTPSErrors: true,
        });

        const page = await browser.newPage();

        // Set HTML content
        await page.setContent(html, {
            waitUntil: "networkidle0",
            timeout: 30000,
        });

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

        console.log("✅ PDF generated successfully");

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
        return res.status(500).json({
            error: "PDF generation failed",
            details: error.message,
        });
    }
}
