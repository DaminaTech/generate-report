// api/generate-pdf.js
// Fixed PDF generation using jsPDF with proper syntax

export default async function handler(req, res) {
    // CORS headers
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
        const { jsPDF } = await import("jspdf");

        console.log("📄 Creating PDF with jsPDF");

        // Parse request
        let requestData = req.body;
        if (typeof req.body === "string") {
            requestData = JSON.parse(req.body);
        }

        console.log("Request data:", requestData);

        const { data: reportData } = requestData;

        if (!reportData) {
            return res.status(400).json({ error: "Report data is required" });
        }

        console.log("Report data:", reportData);

        // Create PDF with proper settings
        const doc = new jsPDF({
            orientation: "portrait",
            unit: "mm",
            format: "a4",
        });

        // Set initial position
        let yPosition = 30;

        // Add top line
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.5);
        doc.line(20, 20, 190, 20);

        // Title section
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");

        let titleText = "";
        let subtitleText = "";

        if (reportData.templateType === "Administrativ") {
            titleText =
                "FISA DE LUCRU nr............ din " +
                (reportData.formattedDate || "");
            subtitleText = "Lucrari de MENTENANTA";
        } else if (reportData.templateType === "Caseta") {
            titleText = "FISA DE LUCRU MENTENANTA CASETA";
            subtitleText = "din " + (reportData.formattedDate || "");
        } else {
            titleText = "FISA DE LUCRU PENTRU CONSTRUCTII INDUSTRIALE";
            subtitleText =
                "Nr .......... din " + (reportData.formattedDate || "");
        }

        // Center the title
        const pageWidth = doc.internal.pageSize.getWidth();
        const titleWidth = doc.getTextWidth(titleText);
        const titleX = (pageWidth - titleWidth) / 2;

        doc.text(titleText, titleX, yPosition);
        yPosition += 8;

        // Subtitle
        doc.setFontSize(12);
        doc.setFont("helvetica", "italic");
        const subtitleWidth = doc.getTextWidth(subtitleText);
        const subtitleX = (pageWidth - subtitleWidth) / 2;
        doc.text(subtitleText, subtitleX, yPosition);

        yPosition += 20;

        // Content fields
        doc.setFontSize(11);
        doc.setFont("helvetica", "normal");

        // Location
        doc.setFont("helvetica", "bold");
        doc.text("Locatia (Aria):", 20, yPosition);
        doc.setFont("helvetica", "normal");
        doc.text(reportData.locatieCompleta || "", 55, yPosition);
        yPosition += 8;

        // Activity type (if not Administrativ)
        if (reportData.templateType !== "Administrativ") {
            doc.setFont("helvetica", "bold");
            doc.text("Tip activitate:", 20, yPosition);
            doc.setFont("helvetica", "normal");
            doc.text(reportData.tipActivitateRoman || "", 55, yPosition);
            yPosition += 8;
        }

        // Work name
        doc.setFont("helvetica", "bold");
        doc.text("Denumire lucrare:", 20, yPosition);
        doc.setFont("helvetica", "normal");
        doc.text(reportData.numelucrare || "", 60, yPosition);
        yPosition += 12;

        // Description
        doc.setFont("helvetica", "bold");
        doc.text("Descriere activitate:", 20, yPosition);
        yPosition += 8;

        doc.setFont("helvetica", "normal");
        const maxWidth = 170;
        const description = reportData.descriereActivitate || "";

        // Split text properly
        const lines = doc.splitTextToSize(description, maxWidth);

        for (let i = 0; i < lines.length; i++) {
            doc.text(lines[i], 20, yPosition);
            yPosition += 5;
        }

        yPosition += 10;

        // Completion status
        doc.setFont("helvetica", "bold");
        doc.text("Lucrare finalizata: DA NU", 20, yPosition);
        yPosition += 20;

        // Signatures section
        doc.setFont("helvetica", "bold");

        if (reportData.templateType === "Administrativ") {
            // Three columns
            doc.text("Executant:", 20, yPosition);
            doc.text("Beneficiar Glina:", 80, yPosition);
            doc.text("Derulator contract:", 140, yPosition);

            yPosition += 10;
            doc.setFont("helvetica", "normal");

            // Names
            doc.text("Nume: _______________", 20, yPosition);
            doc.text("Nume: _______________", 80, yPosition);
            doc.text("Nume: _______________", 140, yPosition);
            yPosition += 7;

            // First names
            doc.text("Prenume: ____________", 20, yPosition);
            doc.text("Prenume: ____________", 80, yPosition);
            doc.text("Prenume: ____________", 140, yPosition);
            yPosition += 7;

            // Signatures
            doc.text("Semnatura: __________", 20, yPosition);
            doc.text("Semnatura: __________", 80, yPosition);
            doc.text("Semnatura: __________", 140, yPosition);
            yPosition += 7;

            // Dates
            const dateText = "Data: " + (reportData.formattedDate || "");
            doc.text(dateText, 20, yPosition);
            doc.text(dateText, 80, yPosition);
            doc.text(dateText, 140, yPosition);
        } else {
            // Two columns
            const leftTitle =
                reportData.templateType === "Industrial"
                    ? "Executant:"
                    : "Nume:";
            const rightTitle =
                reportData.templateType === "Industrial"
                    ? "Reprezentant ANB:"
                    : "Nume:";

            doc.text(leftTitle, 30, yPosition);
            doc.text(rightTitle, 130, yPosition);

            yPosition += 10;
            doc.setFont("helvetica", "normal");

            // Names
            doc.text("Nume: _______________", 30, yPosition);
            doc.text("Nume: _______________", 130, yPosition);
            yPosition += 7;

            // Signatures
            doc.text("Semnatura: __________", 30, yPosition);
            doc.text("Semnatura: __________", 130, yPosition);
            yPosition += 7;

            // Dates
            const dateText = "Data: " + (reportData.formattedDate || "");
            doc.text(dateText, 30, yPosition);
            doc.text(dateText, 130, yPosition);
        }

        // Generate PDF buffer
        const pdfArrayBuffer = doc.output("arraybuffer");
        const pdfBuffer = Buffer.from(pdfArrayBuffer);

        console.log("✅ PDF generated successfully, size:", pdfBuffer.length);

        // Return PDF
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Length", pdfBuffer.length);
        res.setHeader(
            "Content-Disposition",
            'attachment; filename="construction-report.pdf"'
        );

        return res.status(200).send(pdfBuffer);
    } catch (error) {
        console.error("❌ PDF generation failed:", error);
        console.error("Error stack:", error.stack);
        return res.status(500).json({
            error: "PDF generation failed",
            message: error.message,
            stack: error.stack,
        });
    }
}
