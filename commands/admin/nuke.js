const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('nuke')
        .setDescription('ลบทุกข้อความในห้อง (สร้างห้องใหม่)')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

    async execute(interaction) {
        // 1. ตรวจสอบยศก่อนอันดับแรก
        const allowedRoleIDs = ['1393122803871387738']; // เปลี่ยนเป็น ID ของคุณ
        const hasRole = interaction.member.roles.cache.hasAny(...allowedRoleIDs);
        const isAdmin = interaction.member.permissions.has(PermissionFlagsBits.Administrator);

        if (!hasRole && !isAdmin) {
            return interaction.reply({ content: '❌ คุณไม่มีสิทธิ์ใช้งาน!', ephemeral: true });
        }

        // 2. ถ้าผ่านเงื่อนไข ให้เช็คว่าเคยตอบหรือยังก่อนสั่ง defer
        if (!interaction.replied && !interaction.deferred) {
            await interaction.deferReply({ ephemeral: true });
        } else {
            return; // ป้องกันการรันซ้ำ
        }

        try {
            const channel = interaction.channel;

            // 3. เริ่มทำงาน
            const newChannel = await channel.clone();
            await newChannel.setPosition(channel.position);
            await channel.delete();

            // 4. ส่งข้อความในห้องใหม่
            const embed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('☢️ Room Nuked!')
                .setTimestamp();

            await newChannel.send({ embeds: [embed] });

        } catch (error) {
            console.error('Nuke Execute Error:', error);
            // ไม่ต้องสั่ง reply ซ้ำในนี้ เพราะห้องอาจถูกลบไปแล้ว หรือตอบไปแล้ว
        }
    },
};