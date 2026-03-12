const sharp = require('sharp');

async function test() {
    try {
        const metadata = await sharp('/tmp/test_image.webp').metadata();
        console.log('Metadata:', metadata);

        await sharp('/tmp/test_image.webp')
            .resize(1920)
            .webp({ quality: 75 })
            .toFile('/tmp/out.webp');
        console.log('Success resizing');
    } catch (err) {
        console.error('Sharp error:', err);
    }
}

test();
