/**
 * Intelligence Utilities for Lead Ingestion
 */

export const FIELD_ALIASES: Record<string, string[]> = {
    name: ["name", "full name", "client", "patient", "patient name", "lead name", "username", "customer"],
    phone: ["phone", "mobile", "contact", "number", "mobile number", "contact number", "phone number", "cell", "signal"],
    email: ["email", "email address", "mail", "identifier"],
    category: ["category", "treatment", "department", "type", "category name"],
    branchId: ["center", "branch", "location", "clinic", "city", "center name", "branch name"],
};

export function detectHeaders(csvHeaders: string[]) {
    const mapping: Record<string, string> = {
        name: "",
        phone: "",
        email: "",
        category: "",
        branchId: "",
    };

    const normalizedHeaders = csvHeaders.map(h => h.toLowerCase().trim());

    Object.entries(FIELD_ALIASES).forEach(([field, aliases]) => {
        const foundIndex = normalizedHeaders.findIndex(h => 
            aliases.includes(h) || aliases.some(alias => h.includes(alias))
        );
        if (foundIndex !== -1) {
            mapping[field] = csvHeaders[foundIndex];
        }
    });

    return mapping;
}

export function generateCsvTemplate() {
    const headers = ["Name", "Phone", "Email", "Category", "Center"];
    const rows = [
        ["John Doe", "9876543210", "john@example.com", "INFERTILITY", "Raipur"],
        ["Alice Smith", "+91 00000 00000", "alice@example.com", "MATERNITY", "Bhilai"],
    ];

    const csvContent = [
        headers.join(","),
        ...rows.map(r => r.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "scalerx_lead_template.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
