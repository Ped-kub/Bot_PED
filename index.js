require('dotenv').config();

const express = require('express');
const app = express();
const port = process.env.PORT || 10000;

app.get('/', (req, res) => {
  res.send('Bot is online!');
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Server is running on port ${port}`);
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
    EmbedBuilder, 
    AuditLogEvent,
    MessageFlags,
    time 
} = require('discord.js');

const ADD_ROLE_CHANNEL_ID = '1450456011352572087'; 
const REMOVE_ROLE_CHANNEL_ID = '1450456083121442846'; 
const ROLE_LOG_CHANNEL_ID = '1450461123924201492';
const UPDATE_ROLE_LOG_CHANNEL_ID = '1450464244717064283';
const ROLE_DELETE_LOG_ID = '1450465521538699354';
const BAN_LOG_CHANNEL_ID = '1450466985447002286';
const UNBAN_LOG_CHANNEL_ID = '1450468042633908224';
const TOKEN = process.env.BOT_TOKEN;
const { 
    createMenuEmbed, 
    createMenuDropdown, 
    handleInteraction 
} = require('./menuUtils.js');
const { 
    joinVoiceChannel, 
    createAudioPlayer, 
    createAudioResource, 
    AudioPlayerStatus,
    entersState, 
    VoiceConnectionStatus
} = require('@discordjs/voice');
const ffmpegStatic = require('ffmpeg-static'); 
const fs = require('fs');
const path = require('path');
const ytdl = require('ytdl-core');
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);
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


let config = require('./config.json');

client.commands = new Collection();

// ตรวจสอบว่ามีโฟลเดอร์ commands ไหมเพื่อกัน Error
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

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    // 1. เรียก deferReply ทันทีที่เริ่มทำงาน (ใส่ ephemeral ถ้าอยากให้เห็นคนเดียว)
    await interaction.deferReply({ ephemeral: true }).catch(console.error);

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        // 2. ใช้ editReply แทน reply เพราะเรา defer ไปแล้ว
        await interaction.editReply({ 
            content: 'เกิดข้อผิดพลาดในการรันคำสั่งนี้!', 
        }).catch(console.error);
    }
});

const { PermissionFlagsBits, MessageFlags, ChannelType } = require('discord.js');

client.on('interactionCreate', async interaction => {
    if (!interaction.isStringSelectMenu()) return;

    if (interaction.customId === 'room_setup') {
        // 1. แก้ไข Warning: ใช้ MessageFlags.Ephemeral แทน ephemeral: true
        await interaction.deferReply({ flags: [MessageFlags.Ephemeral] }).catch(console.error);

        const { guild, user, values } = interaction;
        const selectedValue = values[0];

        const ROLE_STAFF_ID = '1443797915230539928'; 
        const FRIEND_USER_ID = '1390444294988369971';
        const TRADE_USER_ID = '1056886143754444840';

        let channelName = '';
        let overwrites = [
            {
                id: guild.id, // @everyone
                deny: [PermissionFlagsBits.ViewChannel],
            },
            {
                id: user.id, // ผู้สร้าง
                allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
            }
        ];

        switch (selectedValue) {
            case 'create_item':
                channelName = `🧺-ซื้อของ-${user.username}`;
                overwrites.push({ id: FRIEND_USER_ID, type: 1, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] });
                break;
            case 'create_farm':
                channelName = `🎮-จ้างฟาม-${user.username}`;
                overwrites.push({ id: ROLE_STAFF_ID, type: 0, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] });
                break;
            case 'create_trade':
                channelName = `🙆‍♂️-เทรด-${user.username}`;
                overwrites.push({ id: TRADE_USER_ID, type: 1, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] });
                break;
        }

        try {
            const channel = await guild.channels.create({
                name: channelName,
                type: ChannelType.GuildText,
                parent: interaction.channel.parentId,
                permissionOverwrites: overwrites,
            });

            // ใช้ editReply เพราะเราเรียก deferReply ไปแล้ว
            await interaction.editReply({ content: `✅ สร้างห้องสำเร็จ: ${channel}` });
        } catch (error) {
            console.error('Error:', error);
            await interaction.editReply({ content: '❌ เกิดข้อผิดพลาดในการสร้างห้อง' });
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

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
    client.user.setActivity('ThapxkornAX', {
        type: ActivityType.Streaming,
        url: 'https://www.twitch.tv/star_ssr'
    });
});

client.once('ready', () => {
    console.log(`บอทออนไลน์แล้ว: ${client.user.tag}`);

    const guildId = '1376283535962406942'; // แทนที่ด้วย ID เซิร์ฟเวอร์ของคุณ
    const channelId = '1428553701076766802'; // แทนที่ด้วย ID ห้องเสียงที่ต้องการให้บอทเข้า
    const guild = client.guilds.cache.get(guildId);

    if (guild) {
        joinVoiceChannel({
            channelId: channelId,
            guildId: guild.id,
            adapterCreator: guild.voiceAdapterCreator,
            daveEncryption: false,
        });
        console.log('บอทเข้าห้องเสียงเรียบร้อยแล้ว');
    }
});

client.login(TOKEN);
