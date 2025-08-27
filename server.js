const express = require('express');
const puppeteer = require('puppeteer');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// تقديم الملفات الثابتة
app.use(express.static(path.join(__dirname, 'public')));
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

// API لاستخراج الأزرار
app.get('/api/buttons', async (req, res) => {
    const url = req.query.url;
    if (!url) return res.json({ error: "يرجى إدخال رابط." });

    try {
        const browser = await puppeteer.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-web-security',
                '--disable-features=IsolateOrigins,site-per-process',
                '--window-size=1920,1080'
            ]
        });

        const page = await browser.newPage();

        // تعيين User-Agent حديث
        await page.setUserAgent(
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ' +
            'AppleWebKit/537.36 (KHTML, like Gecko) ' +
            'Chrome/115.0.0.0 Safari/537.36'
        );

        // تعيين حجم نافذة
        await page.setViewport({ width: 1920, height: 1080 });

        // زيارة الصفحة وانتظار DOM
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });

        // انتظار 3 ثوانٍ إضافية لتشغيل JavaScript
        await page.waitForTimeout(3000);

        // استخراج الأزرار
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
        res.json({ error: "تعذر الوصول إلى الموقع. " + err.message });
    }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
