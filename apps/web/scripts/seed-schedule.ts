
const schedule = [
    {
        "title": "Breakfast with The stars",
        "start_time": new Date(new Date().setHours(6, 0, 0, 0)).toISOString(),
        "end_time": new Date(new Date().setHours(10, 0, 0, 0)).toISOString(),
        "presenter_email": "test@example.com",
        "is_live": false
    },
    {
        "title": "Midday Madness",
        "start_time": new Date(new Date().setHours(10, 0, 0, 0)).toISOString(),
        "end_time": new Date(new Date().setHours(14, 0, 0, 0)).toISOString(),
        "is_live": true
    },
    {
        "title": "Evening Chill",
        "start_time": new Date(new Date().setHours(18, 0, 0, 0)).toISOString(),
        "end_time": new Date(new Date().setHours(21, 0, 0, 0)).toISOString(),
        "is_live": false
    }
];

async function seed() {
    console.log('Seeding schedule...');
    try {
        const res = await fetch('http://localhost:3000/api/webhooks/schedule', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.CRON_SECRET || 'test_secret'}` // We need to set this env var locally to test
            },
            body: JSON.stringify(schedule)
        });

        if (!res.ok) {
            const text = await res.text();
            console.error(`Failed: ${res.status} ${res.statusText}`);
            console.error(text);
            return;
        }

        const data = await res.json();
        console.log('Success:', data);
    } catch (e) {
        console.error('Error:', e);
    }
}

seed();
