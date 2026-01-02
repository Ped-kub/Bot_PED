const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('nuke')
        .setDescription('ลบทุกข้อความในห้อง (สร้างห้องใหม่)')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

    async execute(interaction) {
        // 1. เช็คยศด้วย ID (แม่นยำกว่าชื่อ)
        // วิธีเอา ID: คลิกขวาที่ยศใน Discord > Copy Role ID
        const allowedRoleIDs = ['1393122803871387738']; // <--- ใส่ Role ID ของแอดมินตรงนี้
        const hasRole = interaction.member.roles.cache.hasAny(...allowedRoleIDs);
        
        // ถ้าไม่มีสิทธิ์ยศ และไม่ใช่ Administrator ของเซิร์ฟเวอร์
        if (!hasRole && !interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return interaction.reply({ content: '❌ คุณไม่มีสิทธิ์ใช้งานคำสั่งนี้!', ephemeral: true });
        }

        // 2. แจ้ง Discord ว่ากำลังประมวลผล (ป้องกัน Timeout)
        await interaction.deferReply({ ephemeral: true });

        try {
            const channel = interaction.channel;

            // 3. เช็คว่าบอทมีสิทธิ์ลบห้องไหม
            if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ManageChannels)) {
                return interaction.editReply({ content: '❌ บอทไม่มีสิทธิ์ **Manage Channels** (จัดการห้อง) กรุณาตรวจสอบสิทธิ์ของบอทครับ' });
            }

            // 4. เริ่มขั้นตอนการ Nuke
            const newChannel = await channel.clone({
                reason: `Nuke โดย ${interaction.user.tag}`
            });

            await newChannel.setPosition(channel.position);
            await channel.delete(`Nuke โดย ${interaction.user.tag}`);

            // 5. ส่ง Embed ในห้องใหม่
            const nukeEmbed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('☢️ Room Nuked!')
                .setDescription(`ห้องถูกล้างข้อมูลเรียบร้อยโดย: ${interaction.user}`)
                .setTimestamp();

            await newChannel.send({ embeds: [nukeEmbed] });

        } catch (error) {
            console.error('Nuke Error:', error);
            // ถ้าลบห้องไปแล้ว interaction จะตาย ให้ใช้ console log ดู error แทน
            if (interaction.channel) {
                await interaction.editReply({ content: `เกิดข้อผิดพลาด: ${error.message}` });
            }
        }
    },
};