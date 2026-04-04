const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const { convertToGeezText, toEthiopianDateString } = require('./utils');

function buildSubjectHtml(imgPath, modeStr, baseZIndex) {
    if (!fs.existsSync(imgPath) || modeStr === 'none') return '';
    let prefix = 'data:image/png;base64,';
    if (imgPath.endsWith('.jpg') || imgPath.endsWith('.jpeg')) prefix = 'data:image/jpeg;base64,';
    const b64Data = fs.readFileSync(imgPath).toString('base64');
    const src = prefix + b64Data;

    let cssClass = 'subject-element';
    let baseStyles = `position:absolute; object-fit:contain; z-index:${baseZIndex}; transition: all 0.3s ease;`;
    let positionStyles = ''; let filterStyles = ''; let scaleTransform = 'scaleX(1)';
    
    const isCutout = modeStr.includes('cutout');
    const isLeft = modeStr.includes('left');
    const isRight = modeStr.includes('right');
    const isCenter = modeStr.includes('center');

    if (isLeft)   positionStyles = `bottom: 0; left: 2%; height: 90%;`;
    if (isRight)  positionStyles = `bottom: 0; right: 2%; height: 90%;`;
    if (isCenter) positionStyles = `bottom: 5%; left: 50%; transform: translateX(-50%); height: 80%;`;

    if (isCutout) {
        filterStyles = `filter: drop-shadow(-15px 15px 35px rgba(0,0,0,0.85)); pointer-events:none;`;
        if (isLeft) scaleTransform = 'scaleX(1)';
        if (isRight) scaleTransform = 'scaleX(-1)';
        if ((isRight || isLeft) && !isCenter) positionStyles += ` transform: ${scaleTransform};`;
    } else {
        baseStyles += ` object-fit:cover; border: 15px solid white; border-radius: 10px; `;
        filterStyles = `box-shadow: 0 40px 100px rgba(0,0,0,0.9);`;
        if (isLeft)   positionStyles = `bottom: 15%; left: 8%; width: 25vw; height: auto; transform: rotate(-4deg);`;
        if (isRight)  positionStyles = `bottom: 15%; right: 8%; width: 25vw; height: auto; transform: rotate(4deg);`;
        if (isCenter) positionStyles = `bottom: 15%; left: 50%; width: 30vw; height: auto; transform: translateX(-50%) rotate(2deg);`;
    }

    const finalStyle = `${baseStyles} ${positionStyles} ${filterStyles}`;
    return `<img src="${src}" class="${cssClass}" style="${finalStyle}" alt="Subject">`;
}

(async () => {
    try {
        console.log('--- Visionary EOTC Engine Execution ---');

        const templateType = (process.env.TEMPLATE_TYPE || "ad").trim();
        const aspectRatio = (process.env.ASPECT_RATIO || "16:9").trim();
        
        let title = convertToGeezText((process.env.TITLE || "አዲስ መርሐግብር").replace(/\\n/g, '<br>'));
        let subTitle = convertToGeezText((process.env.SUB_TITLE || "").replace(/\\n/g, '<br>'));
        let details = convertToGeezText((process.env.DETAILS || "").replace(/\\n/g, '<br>'));
        let cta = convertToGeezText((process.env.CALL_TO_ACTION || "").replace(/\\n/g, '<br>'));
        
        let backgroundImageUrl = (process.env.BACKGROUND_IMAGE_URL || "").trim();
        const focalPoint = (process.env.FOCAL_POINT || "center").trim();
        const logoUrl = (process.env.LOGO_URL || "").trim();

        const s1Mode = (process.env.SUBJECT_1_MODE || "none").trim();
        const s2Mode = (process.env.SUBJECT_2_MODE || "none").trim();
        
        const subject1Html = buildSubjectHtml(path.join(__dirname, 's1_final.png'), s1Mode, 45);
        const subject2Html = buildSubjectHtml(path.join(__dirname, 's2_final.png'), s2Mode, 46);
        const multiSubjectHtml = subject1Html + '\n' + subject2Html;

        if (!backgroundImageUrl) {
            try {
                // Using a more reliable way to get random high-quality orthodox church backgrounds
                backgroundImageUrl = "https://images.unsplash.com/photo-1548678912-41fad1fd49a2?auto=format&fit=crop&q=80&w=3840";
            } catch (err) {}
        }

        const templatePath = path.join(__dirname, 'templates', `${templateType}.html`);
        if (!fs.existsSync(templatePath)) throw new Error(`Template not found.`);
        let htmlContent = fs.readFileSync(templatePath, 'utf8');

        // Cinematic Camera Engine (Global Lens Grain & Vignette)
        const cameraFilmHtml = `
        <svg style="position:absolute; width:0; height:0; pointer-events:none;">
          <filter id="cinematic-grain"><feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="3" stitchTiles="stitch"/><feColorMatrix type="matrix" values="1 0 0 0 0, 0 1 0 0 0, 0 0 1 0 0, 0 0 0 0.1 0"/></filter>
        </svg>
        <div style="position:absolute; top:0; left:0; width:100%; height:100%; pointer-events:none; z-index:9999; mix-blend-mode: overlay; filter:url(#cinematic-grain);"></div>
        <div style="position:absolute; top:0; left:0; width:100%; height:100%; pointer-events:none; z-index:9998; box-shadow: inset 0 0 180px rgba(0,0,0,0.85);"></div>
        `;

        const backgroundHtml = backgroundImageUrl ? `<img src="${backgroundImageUrl}" class="bg-layer" alt="Background">` : '';
        const watermarkHtml = logoUrl ? `<img src="${logoUrl}" class="watermark" style="position:absolute; top:4%; left:50%; transform:translateX(-50%); z-index:50; height:12%; opacity:0.8; mix-blend-mode:screen; transition: all 0.5s ease;" alt="Watermark">` : '';
        const ecDate = toEthiopianDateString();

        htmlContent = htmlContent
            .replace('<!-- BACKGROUND_LAYER -->', backgroundHtml)
            .replace('<!-- WATERMARK_LAYER -->', watermarkHtml + cameraFilmHtml)
            .replace('<!-- SUBJECT_LAYER -->', multiSubjectHtml)
            .replace('/* FOCAL_POINT_PLACEHOLDER */', `object-position: ${focalPoint};`)
            .replace('<!-- TITLE -->', title)
            .replace('<!-- SUB_TITLE -->', subTitle)
            .replace('<!-- DETAILS -->', details)
            .replace('<!-- CALL_TO_ACTION -->', cta)
            .replace('<!-- EC_DATE -->', ecDate);

        const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
        const page = await browser.newPage();
        
        let vWidth = 3840; let vHeight = 2160;
        if (aspectRatio === "4:5") { vWidth = 2160; vHeight = 2700; }
        else if (aspectRatio === "9:16") { vWidth = 2160; vHeight = 3840; }

        await page.setViewport({ width: vWidth, height: vHeight, deviceScaleFactor: 2 });
        await page.setContent(htmlContent, { waitUntil: ['networkidle0', 'load'] });
        await page.evaluate(async () => await document.fonts.ready);
        
        // Execute Visionary Physics Physics Post-Load
        await page.evaluate(() => {
            // 1. Color Extraction Matrix
            try {
                const bgImg = document.querySelector('.bg-layer');
                if (bgImg) {
                    const cvs = document.createElement('canvas');
                    const ctx = cvs.getContext('2d');
                    cvs.width = 64; cvs.height = 64;
                    ctx.drawImage(bgImg, 0, 0, 64, 64);
                    const dat = ctx.getImageData(0, 0, 64, 64).data;
                    let r=0,g=0,b=0;
                    for(let i=0; i<dat.length; i+=4){ r+=dat[i]; g+=dat[i+1]; b+=dat[i+2]; }
                    const px = dat.length/4;
                    r=Math.floor(r/px); g=Math.floor(g/px); b=Math.floor(b/px);
                    
                    // Emphasize Deep Shadows based on environment average
                    document.documentElement.style.setProperty('--seal-blue', `rgb(${Math.max(r-30,0)}, ${Math.max(g-30,0)}, ${Math.max(b-10,0)})`);
                    document.documentElement.style.setProperty('--deep-blue', `rgb(${Math.max(r-40,0)}, ${Math.max(g-40,0)}, ${Math.max(b-20,0)})`);
                }
            } catch(e) {}

            // 2. Headless Auto-Bounding Text Physics
            const shrink = (el) => {
                if(!el) return;
                let size = parseFloat(window.getComputedStyle(el).fontSize);
                while((el.scrollHeight > el.clientHeight || el.scrollWidth > el.clientWidth) && size > 15) {
                    size -= 1;
                    el.style.fontSize = size + 'px';
                }
            };
            document.querySelectorAll('.title-box, .subtitle-box, .details-box, .details, .cta-box').forEach(el => shrink(el));

            // 3. Watermark Collision Avoidance
            const wm = document.querySelector('.watermark');
            const centerSubj = document.querySelector('img[style*="left: 50%"]');
            if (wm && centerSubj) {
                wm.style.left = '95%';
                wm.style.transform = 'translate(-100%, 0)';
            }
        });

        await new Promise(r => setTimeout(r, 2500));

        await page.screenshot({ path: path.join(__dirname, `output.png`), type: 'png', omitBackground: true });
        await browser.close();
        console.log(`SUCCESS! Visionary EOTC Engine Matrix complete.`);

    } catch (error) {
        console.error('ERROR:', error);
        process.exit(1);
    }
})();
