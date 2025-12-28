const { SlashCommandBuilder } = require('discord.js');
const User = require('../../models/User'); // 1. เรียกใช้ Model MongoDB

// 🔒 รายชื่อ ID ที่มีสิทธิ์ใช้คำสั่งนี้
const ADMIN_IDS = [
    '910909335784288297',  //เป็ด
    '774417760281165835',   // พี่เเอล
    '1319982025557413949',  //คุณมิริม
    '1056886143754444840',  //เกโต้
    '926336093253677157',   //โอม
    '1390444294988369971'  //พี่โทจิ
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('removepoints')
        .setDescription('ลบแต้มออกจากผู้ใช้ (Admin Only)')
        .addUserOption(option => 
            option.setName('target')
                .setDescription('คนที่จะลบแต้ม')
                .setRequired(true))
        .addIntegerOption(option => 
            option.setName('amount')
                .setDescription('จำนวนแต้มที่จะลบ')
                .setRequired(true)),
                
    async execute(interaction) {
        // 1. เช็คสิทธิ์ Admin
        if (!ADMIN_IDS.includes(interaction.user.id)) {
            return interaction.editReply({ content: '❌ คุณไม่มีสิทธิ์ใช้คำสั่งนี้' });
        }

        const targetUser = interaction.options.getUser('target');
        const amount = interaction.options.getInteger('amount');

        if (amount <= 0) {
            return interaction.editReply({ content: '❌ จำนวนแต้มต้องมากกว่า 0' });
        }

        // 2. ดึงข้อมูลจาก MongoDB
        let userData = await User.findOne({ userId: targetUser.id });

        // 3. ตรวจสอบว่ามีแต้มให้ลบหรือไม่
        // ถ้าไม่เจอ User (null) หรือ แต้มเป็น 0 หรือ น้อยกว่า 0
        if (!userData || userData.points <= 0) {
            return interaction.editReply({ content: `⚠️ **${targetUser.username}** ไม่มีแต้มให้ลบแล้วครับ` });
        }

        // 4. คำนวณการลบ (ไม่ให้ติดลบ)
        const oldPoints = userData.points;
        let newPoints = oldPoints - amount;
        if (newPoints < 0) newPoints = 0; // ถ้าลบเกิน ให้เหลือ 0

        // 5. บันทึกค่าใหม่ลง MongoDB
        userData.points = newPoints;
        await userData.save();

        // 6. แจ้งผล
        await interaction.editReply({
            content: `🗑️ **ลบแต้มสำเร็จ!**\n👤 จาก: ${targetUser}\n➖ หักออก: **${amount}** แต้ม\n💰 ยอดคงเหลือ: **${newPoints}** แต้ม`
        });
    },
};