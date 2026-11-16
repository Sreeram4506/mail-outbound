function buildHtmlEmail({ body, contactName, previewText }) {
  const bodyHtml = body
    .split("\n\n")
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p style="margin:0 0 16px 0;">${p.replace(/\n/g, "<br>")}</p>`)
    .join("\n            ");

  const preview = previewText || body.slice(0, 120).replace(/\n/g, " ");

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="x-apple-disable-message-reformatting">
<meta name="color-scheme" content="light">
<title>Indraam</title>
</head>
<body style="margin:0;padding:0;background-color:#e9e9ea;-webkit-text-size-adjust:100%;">
<!-- Preview text shown in inbox list -->
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:#e9e9ea;font-size:1px;line-height:1px;">${preview}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#e9e9ea;">
  <tr>
    <td align="center" style="padding:24px 12px;">

<!-- ===== INDRAAM EMAIL HEADER (start) ===== -->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#2b2b2d;">
  <tr>
    <td align="center" style="padding:0;">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;">
        <tr>
          <td style="padding:22px 28px 20px 28px;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
              <tr>
                <td width="56" valign="middle" style="width:56px;">
                  <a href="https://www.indraam.com/" target="_blank" style="text-decoration:none;"><img src="https://www.indraam.com/assets/logo.png" width="48" height="48" alt="Indraam" style="display:block;border:0;outline:none;width:48px;height:48px;"></a>
                </td>
                <td valign="middle" style="padding-left:6px;">
                  <a href="https://www.indraam.com/" target="_blank" style="text-decoration:none;font-family:Arial,Helvetica,sans-serif;font-size:24px;line-height:28px;font-weight:700;letter-spacing:5px;color:#f2f2f3;">INDRAAM</a>
                  <div style="font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:18px;letter-spacing:1px;color:#edcd8c;text-transform:uppercase;">AI automation &middot; Web &amp; apps &middot; Digital marketing</div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr><td style="height:3px;line-height:3px;font-size:3px;background-color:#9b7527;">&nbsp;</td></tr>
      </table>
    </td>
  </tr>
</table>
<!-- ===== INDRAAM EMAIL HEADER (end) ===== -->

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#ffffff;">
  <tr>
    <td align="center" style="padding:0;">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;">
        <tr>
          <td style="padding:32px 28px 36px 28px;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:26px;color:#1d1f20;">
            <!-- ===== AI-GENERATED MESSAGE ===== -->
            ${bodyHtml}
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 20px 0;">
              <tr>
                <td bgcolor="#9b7527" style="background-color:#9b7527;border-radius:4px;">
                  <a href="https://www.indraam.com/#contact" target="_blank" style="display:inline-block;padding:13px 26px;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;">Book a call</a>
                </td>
              </tr>
            </table>
            <p style="margin:0;">Regards,<br><strong>Team Indraam</strong></p>
            <!-- ===== END OF MESSAGE ===== -->
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>

<!-- ===== INDRAAM EMAIL FOOTER (start) ===== -->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#2b2b2d;">
  <tr>
    <td align="center" style="padding:0;">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;">
        <tr><td style="height:3px;line-height:3px;font-size:3px;background-color:#9b7527;">&nbsp;</td></tr>
        <tr>
          <td align="center" style="padding:28px 28px 8px 28px;font-family:Arial,Helvetica,sans-serif;">
            <div style="font-size:18px;line-height:24px;font-weight:700;letter-spacing:4px;color:#f2f2f3;">INDRAAM</div>
            <div style="font-size:13px;line-height:20px;color:#edcd8c;padding-top:4px;">We build systems that do the work.</div>
          </td>
        </tr>
        <tr>
          <td align="center" style="padding:14px 28px 6px 28px;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:22px;">
            <a href="https://www.indraam.com/" target="_blank" style="color:#f2f2f3;text-decoration:none;">Website</a>
            <span style="color:#7d7d80;">&nbsp;&nbsp;|&nbsp;&nbsp;</span>
            <a href="https://www.indraam.com/services.html" target="_blank" style="color:#f2f2f3;text-decoration:none;">Services</a>
            <span style="color:#7d7d80;">&nbsp;&nbsp;|&nbsp;&nbsp;</span>
            <a href="https://www.indraam.com/digital-marketing/" target="_blank" style="color:#f2f2f3;text-decoration:none;">Digital Marketing</a>
            <span style="color:#7d7d80;">&nbsp;&nbsp;|&nbsp;&nbsp;</span>
            <a href="https://www.indraam.com/#contact" target="_blank" style="color:#edcd8c;text-decoration:none;font-weight:700;">Book a call</a>
          </td>
        </tr>
        <tr>
          <td align="center" style="padding:6px 28px 14px 28px;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:22px;">
            <a href="https://www.linkedin.com/company/indraam/" target="_blank" style="color:#bdbdc0;text-decoration:underline;">LinkedIn</a>
            <span style="color:#7d7d80;">&nbsp;&middot;&nbsp;</span>
            <a href="https://x.com/indraam__" target="_blank" style="color:#bdbdc0;text-decoration:underline;">X</a>
            <span style="color:#7d7d80;">&nbsp;&middot;&nbsp;</span>
            <a href="https://www.facebook.com/share/1FTBBjPXtr/" target="_blank" style="color:#bdbdc0;text-decoration:underline;">Facebook</a>
            <span style="color:#7d7d80;">&nbsp;&middot;&nbsp;</span>
            <a href="https://www.instagram.com/indraam26" target="_blank" style="color:#bdbdc0;text-decoration:underline;">Instagram</a>
          </td>
        </tr>
        <tr>
          <td align="center" style="padding:0 28px 6px 28px;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:20px;color:#bdbdc0;">
            Boston, MA &middot; Hyderabad &middot; Guntur<br>
            <a href="mailto:hello@indraam.com" style="color:#edcd8c;text-decoration:none;">hello@indraam.com</a>
          </td>
        </tr>
        <tr>
          <td align="center" style="padding:14px 28px 30px 28px;font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:18px;color:#8e8e91;">
            You are receiving this email because you are connected with Indraam.<br>
            If you prefer not to receive these emails, reply with &ldquo;unsubscribe&rdquo;.
            &nbsp;&middot;&nbsp;
            <a href="https://www.indraam.com/privacy.html" target="_blank" style="color:#bdbdc0;text-decoration:underline;">Privacy Policy</a>
            &nbsp;&middot;&nbsp;
            <a href="https://www.indraam.com/terms.html" target="_blank" style="color:#bdbdc0;text-decoration:underline;">Terms</a><br>
            &copy; 2026 Indraam. All rights reserved.
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
<!-- ===== INDRAAM EMAIL FOOTER (end) ===== -->

    </td>
  </tr>
</table>
</body>
</html>`;
}

export { buildHtmlEmail };
