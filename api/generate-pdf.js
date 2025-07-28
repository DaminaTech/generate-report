// api/generate-pdf.js
// Simple PDF generation using jsPDF

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

        const { data: reportData } = requestData;

        if (!reportData) {
            return res.status(400).json({ error: "Report data is required" });
        }

        // Create PDF
        const doc = new jsPDF("p", "mm", "a4");

        // Set font
        doc.setFont("times", "normal");
        doc.setFontSize(12);

        // Add content
        let yPosition = 30;

        // Title
        doc.setFontSize(14);
        doc.setFont("times", "bold");

        if (reportData.templateType === "Administrativ") {
            doc.text(
                "FIȘA DE LUCRU nr............ din " + reportData.formattedDate,
                105,
                yPosition,
                { align: "center" }
            );
            yPosition += 10;
            doc.setFont("times", "italic");
            doc.text("Lucrari de MENTENANTA", 105, yPosition, {
                align: "center",
            });
        } else if (reportData.templateType === "Caseta") {
            doc.text("FIȘA DE LUCRU MENTENANTA CASETA", 105, yPosition, {
                align: "center",
            });
            yPosition += 10;
            doc.text("din " + reportData.formattedDate, 105, yPosition, {
                align: "center",
            });
        } else {
            doc.text(
                "FIȘA DE LUCRU PENTRU CONSTRUCTII INDUSTRIALE",
                105,
                yPosition,
                { align: "center" }
            );
            yPosition += 10;
            doc.text(
                "Nr .......... din " + reportData.formattedDate,
                105,
                yPosition,
                { align: "center" }
            );
        }

        yPosition += 20;

        // Fields
        doc.setFontSize(12);
        doc.setFont("times", "bold");
        doc.text("Locația (Aria): ", 20, yPosition);
        doc.setFont("times", "normal");
        doc.text(reportData.locatieCompleta, 60, yPosition);
        yPosition += 10;

        if (reportData.templateType !== "Administrativ") {
            doc.setFont("times", "bold");
            doc.text("Tip activitate: ", 20, yPosition);
            doc.setFont("times", "normal");
            doc.text(reportData.tipActivitateRoman, 60, yPosition);
            yPosition += 10;
        }

        doc.setFont("times", "bold");
        doc.text("Denumire lucrare: ", 20, yPosition);
        doc.setFont("times", "normal");
        doc.text(reportData.numelucrare, 60, yPosition);
        yPosition += 15;

        // Description
        doc.setFont("times", "bold");
        doc.text("Descriere activitate:", 20, yPosition);
        yPosition += 10;

        doc.setFont("times", "normal");
        const splitDescription = doc.splitTextToSize(
            reportData.descriereActivitate,
            170
        );
        doc.text(splitDescription, 20, yPosition);
        yPosition += splitDescription.length * 5 + 15;

        // Completion status
        doc.setFont("times", "bold");
        doc.text("Lucrare finalizata: DA NU", 20, yPosition);
        yPosition += 20;

        // Signatures
        if (reportData.templateType === "Administrativ") {
            // 3 columns
            doc.text("Executant:", 20, yPosition);
            doc.text("Beneficiar Glina:", 80, yPosition);
            doc.text("Derulator contract:", 140, yPosition);

            yPosition += 10;
            doc.setFont("times", "normal");
            doc.text("Nume: _______________", 20, yPosition);
            doc.text("Nume: _______________", 80, yPosition);
            doc.text("Nume: _______________", 140, yPosition);

            yPosition += 8;
            doc.text("Prenume: ____________", 20, yPosition);
            doc.text("Prenume: ____________", 80, yPosition);
            doc.text("Prenume: ____________", 140, yPosition);

            yPosition += 8;
            doc.text("Semnatura: __________", 20, yPosition);
            doc.text("Semnatura: __________", 80, yPosition);
            doc.text("Semnatura: __________", 140, yPosition);

            yPosition += 8;
            doc.text("Data: " + reportData.formattedDate, 20, yPosition);
            doc.text("Data: " + reportData.formattedDate, 80, yPosition);
            doc.text("Data: " + reportData.formattedDate, 140, yPosition);
        } else {
            // 2 columns
            const leftTitle =
                reportData.templateType === "Industrial"
                    ? "Executant:"
                    : "Nume:";
            const rightTitle =
                reportData.templateType === "Industrial"
                    ? "Reprezentant ANB:"
                    : "Nume:";

            doc.setFont("times", "bold");
            doc.text(leftTitle, 30, yPosition);
            doc.text(rightTitle, 130, yPosition);

            yPosition += 10;
            doc.setFont("times", "normal");
            doc.text("Nume: _______________", 30, yPosition);
            doc.text("Nume: _______________", 130, yPosition);

            yPosition += 8;
            doc.text("Semnatura: __________", 30, yPosition);
            doc.text("Semnatura: __________", 130, yPosition);

            yPosition += 8;
            doc.text("Data: " + reportData.formattedDate, 30, yPosition);
            doc.text("Data: " + reportData.formattedDate, 130, yPosition);
        }

        // Generate PDF buffer
        const pdfBuffer = Buffer.from(doc.output("arraybuffer"));

        console.log("✅ PDF generated, size:", pdfBuffer.length);

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
        return res.status(500).json({
            error: "PDF generation failed",
            message: error.message,
        });
    }
}
