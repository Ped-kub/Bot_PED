require('dotenv').config();
const express = require('express');
const app = express();
const port = process.env.PORT || 10000;

app.get('/', (req, res) => res.send('Bot is online!'));
app.listen(port, '0.0.0.0', () => {
    console.log(`Server running on port ${port}`);
});

const {
    Client, 
    GatewayIntentBits, 
    ActivityType, 
    OnlineStatus, 
    PermissionsBitField, 
    ChannelType,
    PermissionFlagsBits,
    Collection,
    StringSelectMenuBuilder,
    EmbedBuilder, 
    AuditLogEvent,
    ActionRowBuilder,
    MessageFlags,
    StringSelectMenuOptionBuilder,
    ButtonBuilder, 
    ButtonStyle,
    time 
} = require('discord.js');

const TOKEN = process.env.BOT_TOKEN;

const ADD_ROLE_CHANNEL_ID = '1450456011352572087'; 
const REMOVE_ROLE_CHANNEL_ID = '1450456083121442846'; 
const ROLE_LOG_CHANNEL_ID = '1450461123924201492';
const UPDATE_ROLE_LOG_CHANNEL_ID = '1450464244717064283';
const ROLE_DELETE_LOG_ID = '1450465521538699354';
const BAN_LOG_CHANNEL_ID = '1450466985447002286';
const UNBAN_LOG_CHANNEL_ID = '1450468042633908224';

const TARGET_CATEGORY_ID = '1428682337952206848';
const STAFF_ROLE_ID = '1443797915230539928';
const NOTIFY_ITEM_USERS = ['1390444294988369971'];
const NOTIFY_TRADE_USERS = ['1056886143754444840'];


const fs = require('fs');
const path = require('path');
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);
const { products, farmPackages } = require('./config.js');
const { 
    createMenuEmbed, 
    createMenuDropdown, 
    handleInteraction 
} = require('./menuUtils.js');
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMembers, 
        GatewayIntentBits.GuildModeration
    ]
});

function translatePerms(bitfield) {
    const p = new PermissionsBitField(bitfield);
    const important = [];
    if (p.has(PermissionsBitField.Flags.Administrator)) important.push('⭐ผู้ดูแลระบบ');
    if (p.has(PermissionsBitField.Flags.ManageGuild)) important.push('จัดการเซิร์ฟเวอร์');
    if (p.has(PermissionsBitField.Flags.ManageRoles)) important.push('จัดการยศ');
    if (p.has(PermissionsBitField.Flags.ManageChannels)) important.push('จัดการห้อง');
    if (p.has(PermissionsBitField.Flags.BanMembers)) important.push('แบนสมาชิก');
    if (p.has(PermissionsBitField.Flags.MentionEveryone)) important.push('แท็กทุกคน');
    return important.length > 0 ? important.join(', ') : 'สิทธิ์ทั่วไป';
}

client.commands = new Collection();

if (fs.existsSync(foldersPath)) {
    const commandFolders = fs.readdirSync(foldersPath);
    for (const folder of commandFolders) {
        const commandsPath = path.join(foldersPath, folder);
        const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
        for (const file of commandFiles) {
            const filePath = path.join(commandsPath, file);
            const command = require(filePath);
            if ('data' in command && 'execute' in command) {
                client.commands.set(command.data.name, command);
            }
        }
    }
}
/* ================= INTERACTION HANDLER ================= */
client.on('interactionCreate', async interaction => {

     const { guild, user, customId, values } = interaction;

    // 1. จัดการ Slash Command
      if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);
        if (!command) return;
        try {
            await interaction.deferReply({ ephemeral: command.ephemeral || false });
            await command.execute(interaction);
        } catch (error) {
            console.error("Command Error:", error);
            if (interaction.deferred) await interaction.editReply('เกิดข้อผิดพลาด!');
            else await interaction.reply({ content: 'เกิดข้อผิดพลาด!', ephemeral: true });
        }
        return;
    }

     if (interaction.isButton() && interaction.customId === 'close_room') {
        const ALLOWED_USER_IDS = ['1390444294988369971', '774417760281165835', '1056886143754444840'];
        const isStaff = interaction.member.roles.cache.has(STAFF_ROLE_ID);
        const isAllowedUser = ALLOWED_USER_IDS.includes(interaction.user.id);

        if (!isStaff && !isAllowedUser) {
            return interaction.reply({ content: '❌ เฉพาะทีมงานเท่านั้นที่ปิดห้องได้', flags: [MessageFlags.Ephemeral] });
        }

        try {
            await interaction.reply({ content: '🔒 กำลังลบห้องนี้ภายใน 3 วินาที...' });
            setTimeout(async () => { await interaction.channel.delete().catch(() => {}); }, 3000);
        } catch (error) { console.error('ลบห้องผิดพลาด:', error); }
        return;
    }

    if (interaction.isStringSelectMenu()) {
        let selected = null;
        if (interaction.customId === 'select_product') selected = products[interaction.values[0]];
        if (interaction.customId === 'select_farm') selected = farmPackages[interaction.values[0]];

        if (selected) {
    const detailEmbed = new EmbedBuilder()
        .setTitle(`${selected.emoji || '✨'} ${selected.name}`)
        .setColor('#f1c40f')
        .setDescription(
            `💰 **ราคา:** ${selected.price}\n\n` +
            `${selected.description || ''}\n` +
            `${selected.details || ''}\n\n` + // ดึงค่า details มาแสดงใน description
            `*กรุณารอทีมงานมาตอบกลับสักครู่ครับ*`
        )
        .setTimestamp();

    // ตรวจสอบว่ามีรูปภาพหรือไม่ (ใน config อาจใช้ชื่อ img หรือ image)
    if (selected.img) detailEmbed.setImage(selected.img);
    else if (selected.image) detailEmbed.setImage(selected.image);

    return interaction.reply({ embeds: [detailEmbed] });
        }
    }


    /* ================= SELECT PRODUCT / FARM ================= */
        if (interaction.isStringSelectMenu()) {
        const value = interaction.values[0]; // ประกาศค่าที่เลือกไว้ตรงนี้

        // ดูรายละเอียดสินค้า/ฟาร์ม
        if (customId === 'select_product' || customId === 'select_farm') {
            let selected = (customId === 'select_product') ? products[value] : farmPackages[value];
            if (selected) {
                const detailEmbed = new EmbedBuilder()
                    .setTitle(`✨ รายละเอียด: ${selected.name}`)
                    .setColor('#f1c40f')
                    .setDescription(`${selected.description}\n\n💰 **ราคา:** ${selected.price}\n*กรุณารอทีมงานมาตอบกลับสักครู่ครับ*`)
                    .setImage(selected.img || null);
                return interaction.reply({ embeds: [detailEmbed] });
            }
        }

        // สร้างห้อง (Room Setup)
        if (customId === 'room_setup') {
            try {
                await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

                let channelName = '';
                let welcomeEmbed = new EmbedBuilder().setColor('#2ecc71').setTimestamp();
                let components = [];
                let typeName = ""; 

                // เช็คค่าจาก value (ที่ดึงมาจาก interaction.values[0])
                if (value === 'create_item') {
                    typeName = "🛒 ซื้อของ";
                    channelName = `🧺-ซื้อของ-${user.username}`;
                    welcomeEmbed.setTitle('🛒 ยินดีต้อนรับสู่ร้านค้า พี่ TOJI').setDescription('เลือกสินค้าที่สนใจเพื่อดูราคาและรูปภาพครับ');
                    const menu = new StringSelectMenuBuilder()
                        .setCustomId('select_product').setPlaceholder('--- เลือกสินค้าที่นี่ ---')
                        .addOptions(Object.keys(products).map(key => ({ label: products[key].name, value: key, description: `ราคา: ${products[key].price}`, emoji: products[key].emoji })));
                    components.push(new ActionRowBuilder().addComponents(menu));
                } 
                else if (value === 'create_farm') {
                    typeName = "⚔️ จ้างฟาร์ม";
                    channelName = `🎮-จ้างฟาม-${user.username}`;
                    welcomeEmbed.setTitle('⚔️ บริการจ้างฟาร์ม').setDescription('เลือกประเภทที่จะจ้างฟาร์มด้านล่างครับ');
                    const menu = new StringSelectMenuBuilder()
                        .setCustomId('select_farm').setPlaceholder('--- เลือกประเภทที่จะจ้างฟาร์ม ---')
                        .addOptions(Object.keys(farmPackages).map(key => ({ label: farmPackages[key].name, value: key, description: `ราคา: ${farmPackages[key].price}`, emoji: farmPackages[key].emoji })));
                    components.push(new ActionRowBuilder().addComponents(menu));
                }
                else if (value === 'create_trade') {
                    typeName = "🤝 ติดต่อพ่อค้า";
                    channelName = `🤝-ติดต่อ-${user.username}`;
                    welcomeEmbed.setTitle('🤝 ติดต่อพ่อค้า').setDescription('สวัสดีครับ พิมพ์รายละเอียดที่ต้องการติดต่อทิ้งไว้ได้เลยครับ');
                }

                // สร้างปุ่มปิดห้อง
                const closeBtn = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId('close_room').setLabel('ปิดห้อง').setStyle(ButtonStyle.Danger)
                );
                components.push(closeBtn);

                const channel = await guild.channels.create({
                    name: channelName,
                    type: ChannelType.GuildText,
                    parent: TARGET_CATEGORY_ID,
                    permissionOverwrites: [
                        { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] },
                        { id: user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] },
                        { id: STAFF_ROLE_ID, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] }
                    ]
                });

                await channel.send({ content: `ยินดีต้อนรับครับ ${user}`, embeds: [welcomeEmbed], components: components });
                await interaction.editReply({ content: `✅ สร้างห้องเรียบร้อยแล้ว: ${channel}` });

                // --- ส่วนการแจ้งเตือน DM ---
                const notifyMsg = `🔔 **มีการสร้างห้องใหม่!**\n👤 **ลูกค้า:** ${user.tag}\n📂 **ประเภท:** ${typeName}\n🔗 **ห้อง:** <#${channel.id}>`;

                if (value === 'create_item') {
                    for (const id of NOTIFY_ITEM_USERS) {
                        const target = await guild.members.fetch(id).catch(() => null);
                        if (target) target.send(notifyMsg).catch(() => {});
                    }
                } 
                else if (value === 'create_trade') {
                    for (const id of NOTIFY_TRADE_USERS) {
                        const target = await guild.members.fetch(id).catch(() => null);
                        if (target) target.send(notifyMsg).catch(() => {});
                    }
                }
                else if (value === 'create_farm') {
                    const farmStaff = guild.roles.cache.get(STAFF_ROLE_ID)?.members;
                    farmStaff?.forEach(member => {
                        if (!member.user.bot) member.send(notifyMsg).catch(() => {});
                    });
                }

            } catch (error) {
                console.error("Room Error:", error);
                if (interaction.deferred) await interaction.editReply('เกิดข้อผิดพลาดในการสร้างห้อง');
            }
        }
    }
});

client.on('roleCreate', async (role) => {
    // รอระบบอัปเดต Audit Log 1 วินาที
    await new Promise(resolve => setTimeout(resolve, 1000));

    const fetchedLogs = await role.guild.fetchAuditLogs({
        limit: 1,
        type: AuditLogEvent.RoleCreate,
    });

    const roleLog = fetchedLogs.entries.first();
    let executorTag = (roleLog && roleLog.target.id === role.id) ? `<@${roleLog.executor.id}>` : "ไม่ทราบชื่อ";

    const logChannel = client.channels.cache.get(ROLE_LOG_CHANNEL_ID);
    if (!logChannel) return;

    const embed = new EmbedBuilder()
        .setTitle('🆕 ตรวจพบการสร้างยศใหม่')
        .setColor(role.color || 0x3498db)
        .addFields(
            { name: '🌐 เซิร์ฟเวอร์', value: `**${role.guild.name}**`, inline: true },
            { name: '👤 คนสร้าง', value: executorTag, inline: true },
            { name: '🏷️ ชื่อยศ', value: `**${role.name}**`, inline: false },
            { name: '🎨 สี (Hex)', value: `\`${role.hexColor}\``, inline: true },
            { name: '🆔 ID ยศ', value: `\`${role.id}\``, inline: true },
            { name: '⏰ เวลาที่สร้าง', value: time(new Date(), 'F'), inline: false }
        )

    logChannel.send({ embeds: [embed] }).catch(console.error);
});

client.on('roleDelete', async (role) => {
    // รอระบบอัปเดต Audit Log 1 วินาที
    await new Promise(resolve => setTimeout(resolve, 1000));

    // ดึงข้อมูลจาก Audit Log ว่าใครเป็นคนกดลบ
    const fetchedLogs = await role.guild.fetchAuditLogs({
        limit: 1,
        type: AuditLogEvent.RoleDelete,
    });

    const deletionLog = fetchedLogs.entries.first();
    let executorTag = "ไม่ทราบคนลบ (อาจทำโดยระบบ)";
    
    // ตรวจสอบว่าข้อมูลใน Log ตรงกับยศที่เพิ่งลบไปหรือไม่
    if (deletionLog && deletionLog.targetId === role.id) {
        executorTag = `<@${deletionLog.executor.id}>`;
    }

    const logChannel = client.channels.cache.get(ROLE_DELETE_LOG_ID);
    if (!logChannel) return;

    // เตรียมเวลาปัจจุบัน
    const logTime = time(new Date(), 'F');

    const embed = new EmbedBuilder()
        .setTitle('🗑️ ตรวจพบการลบยศ')
        .setColor(0xFF0000) // สีแดง (เพราะเป็นการสูญเสียข้อมูล)
        .addFields(
            { name: '🌐 เซิร์ฟเวอร์', value: `**${role.guild.name}**`, inline: true },
            { name: '👤 คนลบ', value: executorTag, inline: true },
            { name: '🏷️ ยศที่ถูกลบ', value: `**${role.name}**`, inline: false },
            { name: '🎨 สีเดิมของยศ', value: `\`${role.hexColor}\``, inline: true },
            { name: '🆔 ID ยศเดิม', value: `\`${role.id}\``, inline: true },
            { name: '⏰ เวลาที่ถูกลบ', value: logTime, inline: false }
        )
        .setTimestamp()

    logChannel.send({ 
        content: `⚠️ ยศ **${role.name}** ถูกลบออกจากเซิร์ฟเวอร์ **${role.guild.name}**`, 
        embeds: [embed] 
    }).catch(console.error);
});

client.on('guildBanRemove', async (ban) => {
    const { guild, user } = ban;

    // รอ Audit Log อัปเดต 1.5 วินาที
    await new Promise(resolve => setTimeout(resolve, 1500));

    // ดึง Audit Log ล่าสุดที่เป็นการปลดแบน (MEMBER_BAN_REMOVE)
    const fetchedLogs = await guild.fetchAuditLogs({
        limit: 1,
        type: AuditLogEvent.MemberBanRemove,
    });

    const unbanLog = fetchedLogs.entries.first();
    let executor = "ไม่ทราบคนทำ";

    // ตรวจสอบว่าข้อมูลใน Log ตรงกับคนที่ถูกปลดแบนหรือไม่
    if (unbanLog && unbanLog.target.id === user.id) {
        executor = `<@${unbanLog.executor.id}>`;
    }

    const logChannel = client.channels.cache.get(UNBAN_LOG_CHANNEL_ID);
    if (!logChannel) return;

    const embed = new EmbedBuilder()
        .setTitle('🔓 ตรวจพบการปลดแบนสมาชิก')
        .setColor(0x00FF00) // สีเขียว
        .addFields(
            { name: '🌐 เซิร์ฟเวอร์', value: `**${guild.name}**`, inline: true },
            { name: '👤 คนทำ', value: executor, inline: true },
            { name: '🎯 คนที่ถูกปลดแบน', value: `**${user.tag}**\n(ID: ${user.id})`, inline: false },
            { name: '⏰ เวลาที่โดนปลด', value: time(new Date(), 'F') }
        )
        .setThumbnail(user.displayAvatarURL({ dynamic: true }))
        .setTimestamp()

    logChannel.send({ 
        content: `✅ **${user.tag}** ได้รับการปลดแบนโดย ${executor}`, 
        embeds: [embed] 
    }).catch(console.error);
});

client.on('guildBanAdd', async (ban) => {
    const { guild, user } = ban;

    // รอ Audit Log อัปเดต (แนะนำ 1-2 วินาทีเพื่อให้ข้อมูลใน Log พร้อม)
    await new Promise(resolve => setTimeout(resolve, 1500));

    // ดึง Audit Log ล่าสุดที่เป็นการแบน (MEMBER_BAN_ADD)
    const fetchedLogs = await guild.fetchAuditLogs({
        limit: 1,
        type: AuditLogEvent.MemberBanAdd,
    });

    const banLog = fetchedLogs.entries.first();
    let executor = "ไม่ทราบคนทำ";
    let reason = ban.reason || "ไม่ระบุเหตุผล";

    // ตรวจสอบว่าข้อมูลใน Log ตรงกับคนที่ถูกแบนหรือไม่
    if (banLog && banLog.target.id === user.id) {
        executor = `<@${banLog.executor.id}>`;
        // ถ้าแอดมินใส่เหตุผลตอนแบน ระบบจะดึงจาก Audit Log ได้แม่นยำกว่า
        if (banLog.reason) reason = banLog.reason;
    }

    const logChannel = client.channels.cache.get(BAN_LOG_CHANNEL_ID);
    if (!logChannel) return;

    const embed = new EmbedBuilder()
        .setTitle('🔨 ตรวจพบการแบนสมาชิก')
        .setColor(0xFF0000) // สีแดง
        .addFields(
            { name: '🌐 เซิร์ฟเวอร์', value: `**${guild.name}**`, inline: true },
            { name: '👤 คนทำ', value: executor, inline: true },
            { name: '🎯 คนที่ถูกแบน', value: `**${user.tag}**\n(ID: ${user.id})`, inline: false },
            { name: '📄 เหตุผล', value: `\`\`\`${reason}\`\`\`` },
            { name: '⏰ เวลาที่เเบน', value: time(new Date(), 'F') }
        )
        .setThumbnail(user.displayAvatarURL({ dynamic: true }))
        .setTimestamp()

    logChannel.send({ 
        content: `🚨 **${user.tag}** ถูกแบนออกจากเซิร์ฟเวอร์โดย ${executor}`, 
        embeds: [embed] 
    }).catch(console.error);
});

client.on('roleUpdate', async (oldRole, newRole) => {
    // รอ Audit Log อัปเดต
    await new Promise(resolve => setTimeout(resolve, 1000));

    const fetchedLogs = await newRole.guild.fetchAuditLogs({
        limit: 1,
        type: AuditLogEvent.RoleUpdate,
    });

    const roleLog = fetchedLogs.entries.first();
    let executor = (roleLog && roleLog.target.id === newRole.id) ? `<@${roleLog.executor.id}>` : "ไม่ทราบคนทำ";

    const logChannel = client.channels.cache.get(UPDATE_ROLE_LOG_CHANNEL_ID);
    if (!logChannel) return;

    const embed = new EmbedBuilder()
        .setTitle('🛠️ ตรวจพบการแก้ไขยศ')
        .setColor(0xFFAA00) // สีส้ม (เตือนการแก้ไข)
        .setTimestamp()
        .addFields(
            { name: '🌐 เซิร์ฟเวอร์', value: newRole.guild.name, inline: true },
            { name: '👤 ผู้แก้ไข', value: executor, inline: true },
            { name: '🏷️ ยศที่ถูกแก้', value: `**${newRole.name}**`, inline: false }
        );

    // เช็คการเปลี่ยนชื่อ
    if (oldRole.name !== newRole.name) {
        embed.addFields({ name: '📝 เปลี่ยนชื่อ', value: `\`${oldRole.name}\` ➡️ \`${newRole.name}\`` });
    }

    // เช็คการเปลี่ยนสี
    if (oldRole.hexColor !== newRole.hexColor) {
        embed.addFields({ name: '🎨 เปลี่ยนสี', value: `\`${oldRole.hexColor}\` ➡️ \`${newRole.hexColor}\`` });
    }

    // เช็คการเปลี่ยนสิทธิ์ (Permissions)
    if (oldRole.permissions.bitfield !== newRole.permissions.bitfield) {
        embed.addFields(
            { name: '🛠️ สิทธิ์เดิม', value: `\`\`\`${translatePerms(oldRole.permissions.bitfield)}\`\`\``, inline: true },
            { name: '✅ สิทธิ์ใหม่', value: `\`\`\`${translatePerms(newRole.permissions.bitfield)}\`\`\``, inline: true }
        );
        embed.setColor(0xFF0000); // เปลี่ยนเป็นสีแดงถ้ามีการแก้สิทธิ์
    }

    // ถ้าไม่มีข้อมูลที่สำคัญเปลี่ยนเลย (เช่น เปลี่ยนลำดับยศ) ไม่ต้องส่งก็ได้ หรือส่งเป็นแจ้งเตือนเล็กน้อย
    if (embed.data.fields.length > 3) {
        logChannel.send({ embeds: [embed] }).catch(console.error);
    }
});


client.on('guildMemberUpdate', async (oldMember, newMember) => {
    const addedRoles = newMember.roles.cache.filter(role => !oldMember.roles.cache.has(role.id));
    const removedRoles = oldMember.roles.cache.filter(role => !newMember.roles.cache.has(role.id));

    if (addedRoles.size === 0 && removedRoles.size === 0) return;

    // รอ Audit Log อัปเดต
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const fetchedLogs = await newMember.guild.fetchAuditLogs({
        limit: 1,
        type: AuditLogEvent.MemberRoleUpdate,
    });

    const roleLog = fetchedLogs.entries.first();
    let executorTag = "ไม่ทราบชื่อ";
    
    if (roleLog && roleLog.target.id === newMember.id) {
        // แท็กคนทำโดยใช้ <@ID>
        executorTag = `<@${roleLog.executor.id}>`;
    }

    // สร้าง Timestamp ของ Discord (แสดงเวลาแบบ Dynamic)
    const logTime = time(new Date(), 'F'); // แสดงวันและเวลาแบบเต็ม

    // --- กรณีมีการเพิ่มยศ ---
    if (addedRoles.size > 0) {
        const addChannel = client.channels.cache.get(ADD_ROLE_CHANNEL_ID);
        if (addChannel) {
            const addEmbed = new EmbedBuilder()
                .setTitle('➕ มีการเพิ่มยศ')
                .setColor(0x00FF00)
                .setDescription(`**รายละเอียด**`)
                .addFields(
                    { name: '🌐 เซิร์ฟเวอร์', value: `**${newMember.guild.name}**`, inline: true },
                    { name: '👤 คนทำ', value: executorTag, inline: true },
                    { name: '🎯 คนที่ถูกใส่ยศ', value: `<@${newMember.id}>`, inline: true },
                    { name: '🏷️ ยศที่เพิ่ม', value: addedRoles.map(r => r.name).join(', ') },
                    { name: '⏰ เวลาที่ใส่ยศ', value: logTime }
                )
            
            addChannel.send({ content: `🔔 มีการเพิ่มยศให้แก่ <@${newMember.id}>`, embeds: [addEmbed] }).catch(console.error);
        }
    }

    // --- กรณีมีการลบยศ ---
    if (removedRoles.size > 0) {
        const removeChannel = client.channels.cache.get(REMOVE_ROLE_CHANNEL_ID);
        if (removeChannel) {
            const removeEmbed = new EmbedBuilder()
                .setTitle('➖ มีการถอนยศ')
                .setColor(0xFF0000)
                .setDescription(`**รายละเอียด**`)
                .addFields(
                    { name: '🌐 เซิร์ฟเวอร์', value: `**${newMember.guild.name}**`, inline: true },
                    { name: '👤 คนทำ', value: executorTag, inline: true },
                    { name: '🎯 คนที่โดนลบยศ', value: `<@${newMember.id}>`, inline: true },
                    { name: '🏷️ ยศที่ถูกลบยศ', value: removedRoles.map(r => r.name).join(', ') },
                    { name: '⏰ เวลาที่ลบ', value: logTime }
                )
            
            removeChannel.send({ content: `⚠️ มีการถอนยศจาก <@${newMember.id}>`, embeds: [removeEmbed] }).catch(console.error);
        }
    }
});

client.once('ready', () => {
    console.log(`✅ Logged in as ${client.user.tag}`);
    client.user.setActivity('ThapxkornAX', {
        type: ActivityType.Streaming,
        url: 'https://www.twitch.tv/star_ssr'
    });
});

client.login(TOKEN);