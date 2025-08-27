const express = require('express');
const puppeteer = require('puppeteer');
const path = require('path'); // لإدارة المسارات
const app = express();
const PORT = process.env.PORT || 3000;

// تعريف مجلد public وتقديم الملفات الثابتة
app.use(express.static(path.join(__dirname, 'public')));

// عند الوصول للجذر "/"، أرسل index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API لاستخراج الأزرار
app.get('/api/buttons', async (req, res) => {
    const url = req.query.url;
    if (!url) return res.json({ error: "يرجى إدخال رابط." });

    try {
        const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
        const page = await browser.newPage();
        await page.goto(url, { waitUntil: 'networkidle2' });

        const buttons = await page.evaluate(() => {
            const elems = Array.from(document.querySelectorAll('button, a, [role="button"]'));
            return elems.map((el, index) => {
                const text = el.innerText.trim() || "(بدون نص)";
                const id = el.id ? `#${el.id}` : '';
                const cls = el.className ? '.' + el.className.trim().replace(/\s+/g, '.') : '';
                const path = `${el.tagName.toLowerCase()}${id}${cls}`;
                return { index: index + 1, text, path };
            });
        });

        await browser.close();
        res.json(buttons);
    } catch (err) {
        res.json({ error: err.message });
    }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
