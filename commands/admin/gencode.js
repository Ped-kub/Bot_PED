const { SlashCommandBuilder } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');

// 🔥 1. ตั้งค่า: ใครมีสิทธิ์ใช้ และได้แต้มเท่าไหร่
const ADMIN_CONFIG = {
    '910909335784288297': 10,  //เป็ด
    '774417760281165835': 5,   // พี่เเอล
    '1319982025557413949': 4,  //คุณมิริม
    '1056886143754444840': 3,  //เกโต้
    '926336093253677157': 2,   //โอม
    '1390444294988369971': 1,  //พี่โทจิ
};

// ฟังก์ชันหา "วันจันทร์ล่าสุด" (เวลา 00:00 น.)
function getLastMonday() {
    const d = new Date();
    const day = d.getDay(); // 0=อาทิตย์, 1=จันทร์, ..., 6=เสาร์
    
    // คำนวณถอยหลังไปหาวันจันทร์ (ถ้าวันนี้วันอาทิตย์ ให้ถอย 6 วัน, ถ้าวันอื่นถอย day-1)
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); 
    
    const monday = new Date(d.setDate(diff));
    monday.setHours(0, 0, 0, 0); // เซ็ตเป็นเที่ยงคืนเป๊ะ
    return monday;
}

// ฟังก์ชันสุ่มตัวอักษร
function generateRandomCode(length = 8) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('gencode')
        .setDescription('สร้างโค้ดรางวัล (รีเซ็ตทุกวันจันทร์)'),
        
    async execute(interaction) {
        const userId = interaction.user.id;
        const logPath = path.join(__dirname, '../../usage_logs.json'); // ไฟล์เก็บประวัติการกด
        const dbPath = path.join(__dirname, '../../codes.json');   // ไฟล์เก็บโค้ด

        // 🛑 1. เช็คสิทธิ์ Admin
        if (!ADMIN_CONFIG[userId]) {
            return interaction.reply({ content: '❌ คุณไม่มีสิทธิ์ใช้คำสั่งนี้', ephemeral: true });
        }

        // 🛑 2. ระบบเช็ค Cooldown (อาทิตย์ละครั้ง รีเซ็ตวันจันทร์)
        let usageLogs = {};
        try {
            if (fs.existsSync(logPath)) {
                usageLogs = JSON.parse(fs.readFileSync(logPath, 'utf8'));
            }
        } catch (e) { console.log('สร้างไฟล์ Log ใหม่'); }

        const lastMonday = getLastMonday().getTime(); // เวลาของวันจันทร์ล่าสุด (Timestamp)
        const lastUsed = usageLogs[userId] || 0; // เวลาที่ผู้ใช้กดล่าสุด

        // ถ้าเคยกดแล้ว และ เวลานั้นเกิดขึ้น "หลังจาก" วันจันทร์ล่าสุด
        if (lastUsed > lastMonday) {
            return interaction.reply({ 
                content: `⏳ **คุณใช้สิทธิ์ของสัปดาห์นี้ไปแล้ว!**\nระบบจะรีเซ็ตใหม่ใน **วันจันทร์หน้า** ครับ`, 
                ephemeral: true 
            });
        }

        // --- ✅ ผ่านเงื่อนไข: เริ่มสร้างโค้ด ---

        const points = ADMIN_CONFIG[userId];
        const code = generateRandomCode(10);

        // 3. บันทึกโค้ดลง codes.json
        let existingCodes = [];
        try {
            const fileData = fs.readFileSync(dbPath, 'utf8');
            existingCodes = JSON.parse(fileData);
        } catch (err) {}

        existingCodes.push({
            code: code,
            points: points,
            createdBy: interaction.user.tag,
            createdById: userId,
            createdAt: new Date().toISOString(),
            isRedeemed: false
        });

        fs.writeFileSync(dbPath, JSON.stringify(existingCodes, null, 2));

        // 4. บันทึกประวัติการกด (Timestamp ปัจจุบัน) ลง usage_logs.json
        usageLogs[userId] = Date.now();
        fs.writeFileSync(logPath, JSON.stringify(usageLogs, null, 2));

        // 5. ตอบกลับ
        await interaction.reply({
            content: `✅ **สร้างโค้ดประจำสัปดาห์สำเร็จ!**\n🎫 รหัส: \`${code}\`\n💎 มูลค่า: **${points}** แต้ม\n(สิทธิ์ครั้งต่อไป: วันจันทร์หน้า)`,
            ephemeral: true 
        });
    },
};