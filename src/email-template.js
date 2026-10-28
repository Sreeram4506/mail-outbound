function buildHtmlEmail({ body, senderName, logoUrl, companyName = "Indraam", websiteUrl = "", unsubscribeNote = true }) {
  const bodyHtml = body
    .split("\n\n")
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p style="margin:0 0 16px 0;line-height:1.7;color:#333333;font-size:15px;">${p.replace(/\n/g, "<br>")}</p>`)
    .join("\n            ");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Email</title>
  <!--[if mso]>
  <style>table,td{font-family:Arial,sans-serif!important;}</style>
  <![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#f4f4f7;font-family:Arial,'Helvetica Neue',Helvetica,sans-serif;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
  <!-- Wrapper -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f7;">
    <tr>
      <td align="center" style="padding:24px 16px;">

        <!-- Email Container -->
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">

          <!-- Header with Logo -->
          <tr>
            <td style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%);padding:32px 40px;text-align:center;">
              ${logoUrl ? `<img src="${logoUrl}" alt="${companyName}" width="60" height="60" style="display:block;margin:0 auto 12px auto;border:0;outline:none;">` : ""}
              <h1 style="margin:0;color:#d4a843;font-size:22px;font-weight:700;letter-spacing:1px;">${companyName}</h1>
            </td>
          </tr>

          <!-- Gold accent line -->
          <tr>
            <td style="background:linear-gradient(90deg,#d4a843,#c49a38,#d4a843);height:3px;font-size:0;line-height:0;">&nbsp;</td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 40px 24px 40px;">
              ${bodyHtml}
            </td>
          </tr>

          <!-- Signature -->
          <tr>
            <td style="padding:0 40px 32px 40px;">
              <table role="presentation" cellpadding="0" cellspacing="0" style="border-top:1px solid #e8e8ed;padding-top:20px;width:100%;">
                <tr>
                  <td style="padding-top:20px;">
                    ${logoUrl ? `<img src="${logoUrl}" alt="${companyName}" width="36" height="36" style="display:block;margin-bottom:8px;border:0;outline:none;">` : ""}
                    <p style="margin:0 0 2px 0;font-size:15px;font-weight:700;color:#1a1a2e;">${senderName}</p>
                    <p style="margin:0 0 2px 0;font-size:13px;color:#888888;">${companyName}</p>
                    ${websiteUrl ? `<a href="${websiteUrl}" style="font-size:13px;color:#d4a843;text-decoration:none;">${websiteUrl.replace(/^https?:\/\//, "")}</a>` : ""}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#f9f9fb;padding:20px 40px;border-top:1px solid #e8e8ed;">
              <p style="margin:0;font-size:12px;color:#999999;text-align:center;line-height:1.6;">
                ${companyName}${websiteUrl ? ` | <a href="${websiteUrl}" style="color:#d4a843;text-decoration:none;">${websiteUrl.replace(/^https?:\/\//, "")}</a>` : ""}
              </p>
              ${unsubscribeNote ? `<p style="margin:8px 0 0 0;font-size:11px;color:#bbbbbb;text-align:center;">If you'd prefer not to receive these emails, simply reply with "unsubscribe".</p>` : ""}
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>
</body>
</html>`;
}

export { buildHtmlEmail };
