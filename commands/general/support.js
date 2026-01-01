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
                { name: '🕒 เวลาทำการ', value: '24/7', inline: true },
                { name: '💻 เว็บไซต์', value: '[คลิกที่นี่](https://bot-ped.onrender.com)', inline: true },
                { name: '⚠️ แจ้งปัญหาด่วน', value: 'กรุณากดปุ่ม **"📩 ติดต่อทีมงาน"** ด้านล่าง', inline: false }
            )
            .setThumbnail(interaction.client.user.displayAvatarURL())
            .setFooter({ text: 'ระบบ Support โดย ThapxkornAX', iconURL: interaction.user.displayAvatarURL() });

        // 2. สร้างปุ่ม
        const contactBtn = new ButtonBuilder()
            .setCustomId('open_contact_modal') 
            .setLabel('📩 ติดต่อทีมงาน')
            .setStyle(ButtonStyle.Primary); 

        // ⚠️ อย่าลืมใส่ลิงก์ Discord ของคุณตรงนี้
        const linkBtn = new ButtonBuilder()
            .setLabel('🔗 เข้า Discord')
            .setStyle(ButtonStyle.Link)
            .setURL('https://discord.gg/TYKMjukwGT'); 

        const row = new ActionRowBuilder().addComponents(contactBtn, linkBtn);

        // 👇 แก้ตรงนี้ครับ: เปลี่ยนจาก reply เป็น editReply
        await interaction.editReply({ embeds: [embed], components: [row] });
    },
};