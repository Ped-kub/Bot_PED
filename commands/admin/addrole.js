const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('addrole')
        .setDescription('เพิ่มยศให้สมาชิกและแจ้งเตือนไปยังห้องที่กำหนด')
        .addUserOption(opt => opt.setName('target').setDescription('เลือกสมาชิกที่ต้องการใส่ยศ').setRequired(true))
        .addRoleOption(opt => opt.setName('role').setDescription('เลือกยศที่ต้องการใส่').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

    async execute(interaction) {
        // --- 1. กำหนดค่าพื้นฐาน ---
        const allowedRoleIDs = ['1393122803871387738']; 
        const logChannelId = '1430637090479276162'; 
        const evidenceChannelId = '1434019399207096321'; 

        // ตรวจสอบสิทธิ์ผู้ใช้
        const hasPermission = interaction.member.roles.cache.hasAny(...allowedRoleIDs) || 
                              interaction.member.permissions.has(PermissionFlagsBits.Administrator);

        if (!hasPermission) {
            return interaction.editReply({ content: '❌ คุณไม่มีสิทธิ์ใช้งานคำสั่งนี้', ephemeral: true });
        }

        const target = interaction.options.getMember('target');
        const role = interaction.options.getRole('role');
        const logChannel = interaction.guild.channels.cache.get(logChannelId);

        try {
            // --- 2. การดำเนินการเพิ่มยศ ---
            if (target.roles.cache.has(role.id)) {
                return interaction.editReply(`❌ สมาชิกคนนี้มียศ ${role.name} อยู่แล้วครับ`);
            }

            await target.roles.add(role);

            // --- 3. สร้าง Embed แจ้งเตือน ---
            const logEmbed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('📢 บันทึกการเพิ่มยศ')
                .addFields(
                    { name: '👤 ผู้รับยศ', value: `${target} (${target.user.tag})`, inline: true },
                    { name: '🛡️ ยศที่ได้รับ', value: `${role}`, inline: true },
                    { name: '👮 ผู้ดำเนินการ', value: `${interaction.user}`, inline: true },
                    { name: '📂 ดูหลักฐานได้ที่', value: `<#${evidenceChannelId}>` }
                )
                .setTimestamp()
                .setFooter({ text: `ID: ${target.id}` });

            // ส่งข้อความไปที่ห้อง Log
            if (logChannel) {
                await logChannel.send({ embeds: [logEmbed] });
            }

            // ตอบกลับผู้ใช้ที่ใช้คำสั่ง
            return interaction.editReply({ content: `✅ เพิ่มยศ ${role.name} ให้กับ ${target.user.tag} เรียบร้อยและแจ้งเตือนไปที่ห้อง <#${logChannelId}> แล้วครับ` });

        } catch (error) {
            console.error(error);
            return interaction.editReply({ content: '❌ ไม่สามารถเพิ่มยศได้ (ตรวจสอบว่ายศบอทอยู่สูงกว่ายศที่จะเพิ่มหรือไม่)' });
        }
    }
};