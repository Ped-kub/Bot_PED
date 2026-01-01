const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('support')
        .setDescription('ศูนย์ช่วยเหลือและติดต่อทีมงาน'),

    async execute(interaction) {
        // 1. สร้าง Embed ข้อมูล
        const embed = new EmbedBuilder()
            .setTitle('🛠️ ศูนย์ช่วยเหลือ (Support Center)')
            .setDescription('สวัสดีครับ หากคุณพบปัญหาในการใช้งาน หรือต้องการสอบถามข้อมูลเพิ่มเติม สามารถเลือกหัวข้อด้านล่างได้เลยครับ')
            .setColor('#3498db') // สีฟ้า
            .addFields(
                { name: '🕒 เวลาทำการ', value: 'ทุกวัน 10:00 - 24:00 น.', inline: true },
                { name: '💻 เว็บไซต์', value: '[คลิกที่นี่](https://bot-ped.onrender.com)', inline: true },
                { name: '⚠️ แจ้งปัญหาด่วน', value: 'กรุณากดปุ่ม **"📩 ติดต่อทีมงาน"** ด้านล่าง', inline: false }
            )
            .setThumbnail(interaction.client.user.displayAvatarURL())
            .setFooter({ text: 'ระบบ Support โดย ThapxkornAX', iconURL: interaction.user.displayAvatarURL() });

        // 2. สร้างปุ่ม
        const contactBtn = new ButtonBuilder()
            .setCustomId('open_contact_modal') // 👈 ID ปุ่ม เอาไปใช้ใน index.js
            .setLabel('📩 ติดต่อทีมงาน')
            .setStyle(ButtonStyle.Primary); // ปุ่มสีน้ำเงิน

        const linkBtn = new ButtonBuilder()
            .setLabel('🔗 เข้า Discord หลัก')
            .setStyle(ButtonStyle.Link)
            .setURL('https://discord.gg/ใส่ลิงก์ดิสคอร์ดของคุณ'); // 👈 อย่าลืมเปลี่ยนลิงก์

        const row = new ActionRowBuilder().addComponents(contactBtn, linkBtn);

        await interaction.reply({ embeds: [embed], components: [row] });
    },
};