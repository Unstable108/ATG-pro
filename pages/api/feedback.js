// pages/api/feedback.js
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { name, email, type, message } = req.body
  const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN
  const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID

  if (!TELEGRAM_TOKEN || !TELEGRAM_CHAT_ID) return res.status(500).json({ error: 'Server config error' })

  const text = `
New Message from Celestial Novels!
Name: ${name || "Anonymous Disciple"}
Email: ${email || "Not provided"}
Type: ${type}
Message:
${message}
  `.trim()

  try {
    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text,
        parse_mode: 'HTML'
      })
    })
    if (!response.ok) throw new Error('Telegram API failed')
    res.status(200).json({ success: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Transmission failed—try again, disciple.' })
  }
}