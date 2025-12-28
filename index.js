require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const session = require('express-session');
const passport = require('passport');
const DiscordStrategy = require('passport-discord').Strategy;
const { 
    Client, GatewayIntentBits, ActivityType, PermissionsBitField, 
    ChannelType, Collection, StringSelectMenuBuilder, EmbedBuilder, 
    AuditLogEvent, ActionRowBuilder, MessageFlags, ButtonBuilder, 
    PermissionFlagsBits, ButtonStyle, time, OverwriteType 
} = require('discord.js');

// เรียกใช้ Model
const User = require('./models/User'); 
const { products, farmPackages } = require('./config.js');

// ================= 1. ตั้งค่า Server & Database =================
const app = express();
const port = process.env.PORT || 10000;

const ADMIN_IDS = [
    '910909335784288297', 
    '774417760281165835',  
    '1056886143754444840',
    '1319982025557413949',
    '926336093253677157',
    '1390444294988369971',
];

// เชื่อมต่อ MongoDB
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ Connected to MongoDB!'))
    .catch((err) => console.error('❌ MongoDB Connection Error:', err));

// ตั้งค่า Express สำหรับ Web Dashboard
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));

// --- Web Routes ---
app.get('/', (req, res) => {
    const botName = client.user ? client.user.username : "กำลังโหลด...";
    // ส่งข้อมูลไปหน้าเว็บ
    res.render('dashboard', { botName, message: null, status: null });
});

app.post('/add-points', async (req, res) => {
    const { adminPass, targetId, amount } = req.body;
    const botName = client.user ? client.user.username : "Bot";

    if (adminPass !== WEB_ADMIN_PASSWORD) {
        return res.render('dashboard', { botName, message: "❌ รหัสผ่านผิด!", status: "error" });
    }

    try {
        let userData = await User.findOne({ userId: targetId });
        if (!userData) userData = new User({ userId: targetId, points: 0 });

        userData.points += parseInt(amount);
        await userData.save();

        return res.render('dashboard', { 
            botName, 
            message: `✅ เติม ${amount} แต้ม ให้ ID ${targetId} สำเร็จ!`, 
            status: "success" 
        });
    } catch (error) {
        console.error(error);
        return res.render('dashboard', { botName, message: "❌ เกิดข้อผิดพลาดกับ Database", status: "error" });
    }
});

app.listen(port, '0.0.0.0', () => {
    console.log(`🌍 Web Dashboard & Bot Server running on port ${port}`);
});

// ================= 2. ตั้งค่า Discord Bot =================
const TOKEN = process.env.BOT_TOKEN;
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent, GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildModeration
    ]
});

// --- Config Channels & IDs ---
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
const TARGET_CHANNEL_ID = '1434589377173917697'; 

// --- โหลดคำสั่ง ---
client.commands = new Collection();
const foldersPath = path.join(__dirname, 'commands');
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

// --- Helper Functions ---
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

let currentCount = 0; // ตัวแปรเก็บเลขปัจจุบัน (ใน Memory)

// ================= 3. Bot Events =================

client.on('messageCreate', async message => {
    if (message.author.bot) return;
    if (message.channel.id !== TARGET_CHANNEL_ID) return;

    if (message.content.trim() === '+1') {
        currentCount++; // บวกเลขในความจำ

        try {
            // อัปเดตชื่อห้อง (นี่คือ Database ของเราสำหรับระบบนับเลข!)
            await message.channel.setName(`เครดิต-${currentCount}`);
            await message.react('💗');
        } catch (error) {
            console.log(`Rate Limit: นับเป็น ${currentCount} แต่เปลี่ยนชื่อห้องไม่ทัน`);
        }
    }
    
    if (message.content.trim() === '!reset') {
        currentCount = 0;
        await message.channel.setName(`count-${currentCount}`);
        await message.reply('รีเซ็ตเลขเป็น 0 แล้วครับ');
    }
});

/* ================= INTERACTION HANDLER ================= */
client.on('interactionCreate', async interaction => {
    const { guild, user, customId } = interaction;

    // --- 1. Slash Commands ---
    if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);
        if (!command) return;

        try {
            // Safe Defer: ป้องกัน Error Unknown Interaction
            if (!interaction.replied && !interaction.deferred) {
                await interaction.deferReply();
            }
            await command.execute(interaction);
        } catch (error) {
            console.error("Command Error:", error);
            if (interaction.deferred || interaction.replied) {
                await interaction.editReply({ content: '❌ เกิดข้อผิดพลาดในการรันคำสั่งนี้!' }).catch(() => {});
            } else {
                await interaction.reply({ content: '❌ เกิดข้อผิดพลาด!', ephemeral: true }).catch(() => {});
            }
        }
        return;
    }

    // --- 2. Button: Close Room ---
    if (interaction.isButton() && interaction.customId === 'close_room') {
        const ALLOWED_USER_IDS = ['1390444294988369971', '774417760281165835', '1056886143754444840'];
        const isStaff = interaction.member.roles.cache.has(STAFF_ROLE_ID);
        const isAllowedUser = ALLOWED_USER_IDS.includes(interaction.user.id);

        if (!isStaff && !isAllowedUser) {
            return interaction.reply({ content: '❌ เฉพาะทีมงานเท่านั้นที่ปิดห้องได้', flags: [MessageFlags.Ephemeral] });
        }

        try {
            await interaction.reply({ content: '🔒 กำลังลบห้องนี้ภายใน 3 วินาที...' });
            setTimeout(async () => { 
                await interaction.channel.delete().catch(() => {}); 
            }, 3000);
        } catch (error) { console.error('ลบห้องผิดพลาด:', error); }
        return;
    }

    // --- 3. Select Menu: ดูรายละเอียดสินค้า (View Details) ---
    if (interaction.isStringSelectMenu() && (interaction.customId === 'select_product' || interaction.customId === 'select_farm')) {
        // ส่วนนี้อาจจะซ้ำกับด้านล่าง แต่เก็บไว้เผื่อ Logic เก่า
        // (แนะนำให้ใช้ Logic ด้านล่างเป็นหลักเพื่อลดโค้ดซ้ำซ้อน)
    }

    /* ================= SELECT PRODUCT / FARM (Main Logic) ================= */
    if (interaction.isStringSelectMenu()) {
        const value = interaction.values[0];
        
        // --- 3.1 แสดงรายละเอียดสินค้า ---
        let selected = null;
        if (interaction.customId.startsWith('select_product')) selected = products[value];
        if (interaction.customId.startsWith('select_farm')) selected = farmPackages[value];

        if (selected) {
            const embeds = [];
            const imagesToShow = selected.images ? selected.images.slice(0, 3) : [];

            if (imagesToShow.length > 0) {
                imagesToShow.forEach((imgUrl, index) => {
                    const embed = new EmbedBuilder().setColor('#f1c40f').setImage(imgUrl);
                    if (index === 0) {
                        embed.setTitle(`${selected.emoji || '✨'} ${selected.name}`)
                             .setDescription(
                                `💰 **ราคา:** ${selected.price}\n` +
                                `📝 **รายละเอียด:** ${selected.description}\n\n` +
                                `*กรุณารอทีมงานมาตอบกลับสักครู่ครับ*`
                             );
                    }
                    embeds.push(embed);
                });
            } else {
                const noImageEmbed = new EmbedBuilder()
                    .setTitle(`${selected.emoji || '✨'} ${selected.name}`)
                    .setColor('#f1c40f')
                    .setDescription(
                        `💰 **ราคา:** ${selected.price}\n` +
                        `📝 **รายละเอียด:** ${selected.description}\n\n` +
                        `*กรุณารอทีมงานมาตอบกลับสักครู่ครับ*`
                    );
                embeds.push(noImageEmbed);
            }
            return interaction.reply({ embeds: embeds, ephemeral: true });
        }
        
        // --- 3.2 สร้างห้อง (Room Setup) ---
        if (interaction.customId === 'room_setup') {
            try {
                await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

                const selectedValue = interaction.values[0];
                let channelName = '';
                let welcomeEmbed = new EmbedBuilder().setColor('#2ecc71').setTimestamp();
                let components = [];
                let typeName = ""; 
                const overwrites = [
                    { id: interaction.guild.id, type: OverwriteType.Role, deny: [PermissionFlagsBits.ViewChannel] },
                    { id: interaction.user.id, type: OverwriteType.Member, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.AttachFiles] }
                ];
                
                if (selectedValue === 'create_item') {
                    typeName = "🛒 ซื้อของ";
                    channelName = `🧺-ซื้อของ-${user.username}`;
                    welcomeEmbed.setTitle('🛒 ยินดีต้อนรับสู่ร้านค้า พี่ TOJI').setDescription('เลือกสินค้าที่สนใจเพื่อดูราคาและรูปภาพครับ').setImage('https://cdn.discordapp.com/attachments/1133947298628517970/1452087430713966793/Toji.png');
                    
                    const allKeys = Object.keys(products);
                    const menu1 = new StringSelectMenuBuilder().setCustomId('select_product_1').setPlaceholder('--- เลือกสินค้า (หน้า 1) ---')
                        .addOptions(allKeys.slice(0, 25).map(key => ({ label: products[key].name, value: key, description: `ราคา: ${products[key].price}`, emoji: products[key].emoji })));
                    components.push(new ActionRowBuilder().addComponents(menu1));

                    if (allKeys.length > 25) {
                        const menu2 = new StringSelectMenuBuilder().setCustomId('select_product_2').setPlaceholder('--- เลือกสินค้า (หน้า 2) ---')
                            .addOptions(allKeys.slice(25).map(key => ({ label: products[key].name, value: key, description: `ราคา: ${products[key].price}`, emoji: products[key].emoji })));
                        components.push(new ActionRowBuilder().addComponents(menu2));
                    }
                    overwrites.push({ id: STAFF_ROLE_ID, type: 0, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] });
                    NOTIFY_ITEM_USERS.forEach(id => overwrites.push({ id: id, type: 1, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] }));
                }
                else if (selectedValue === 'create_farm') {
                    typeName = "⚔️ จ้างฟาร์ม";
                    channelName = `🎮-จ้างฟาม-${user.username}`;
                    welcomeEmbed.setTitle('⚔️ บริการจ้างฟาร์ม').setDescription('เลือกประเภทที่จะจ้างฟาร์มด้านล่างครับ').setImage('https://cdn.discordapp.com/attachments/1133947298628517970/1451492360361082910/image.png');
                    
                    const allFarmKeys = Object.keys(farmPackages);
                    const menu1 = new StringSelectMenuBuilder().setCustomId('select_farm_1').setPlaceholder('--- เลือกประเภทจ้างฟาร์ม (หน้า 1) ---')
                        .addOptions(allFarmKeys.slice(0, 25).map(key => ({ label: farmPackages[key].name, value: key, description: `ราคา: ${farmPackages[key].price}`, emoji: farmPackages[key].emoji })));
                    components.push(new ActionRowBuilder().addComponents(menu1));
                    
                    overwrites.push({ id: STAFF_ROLE_ID, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] });
                    NOTIFY_ITEM_USERS.forEach(id => overwrites.push({ id: id, type: 0, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] }));
                }
                else if (selectedValue === 'create_trade') {
                    typeName = "🤝 ติดต่อพ่อค้า";
                    channelName = `🤝-ติดต่อ-${user.username}`;
                    welcomeEmbed.setTitle('🤝 ติดต่อพ่อค้า').setDescription('สวัสดีครับ พิมพ์รายละเอียดที่ต้องการติดต่อทิ้งไว้ได้เลยครับ');
                    NOTIFY_TRADE_USERS.forEach(id => { if (id) overwrites.push({ id: id, type: 1, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] }); });
                }

                components.push(new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('close_room').setLabel('ปิดห้อง').setStyle(ButtonStyle.Danger)));

                const channel = await guild.channels.create({ name: channelName, type: ChannelType.GuildText, parent: TARGET_CATEGORY_ID, permissionOverwrites: overwrites });
                await channel.send({ content: `ยินดีต้อนรับครับ ${user}`, embeds: [welcomeEmbed], components: components });
                await interaction.editReply({ content: `✅ สร้างห้องเรียบร้อยแล้ว: ${channel}` });
                await interaction.message.edit({ components: interaction.message.components }).catch(() => {}); 

                // --- แจ้งเตือน DM ---
                const notifyMsg = `🔔 **มีการสร้างห้องใหม่!**\n👤 **ลูกค้า:** ${user.tag}\n📂 **ประเภท:** ${typeName}\n🔗 **ห้อง:** <#${channel.id}>`;
                if (selectedValue === 'create_item') NOTIFY_ITEM_USERS.forEach(async id => (await guild.members.fetch(id).catch(() => null))?.send(notifyMsg).catch(() => {}));
                else if (selectedValue === 'create_trade') NOTIFY_TRADE_USERS.forEach(async id => (await guild.members.fetch(id).catch(() => null))?.send(notifyMsg).catch(() => {}));
                else if (selectedValue === 'create_farm') guild.roles.cache.get(STAFF_ROLE_ID)?.members?.forEach(m => !m.user.bot && m.send(notifyMsg).catch(() => {}));

            } catch (error) {
                console.error("Room Error:", error);
                if (interaction.deferred) await interaction.editReply('เกิดข้อผิดพลาดในการสร้างห้อง');
            }
        }
    }
});

// ================= 4. Logging Events (Roles/Bans) =================
// (ย่อส่วนนี้ให้สั้นลง แต่ทำงานเหมือนเดิมครับ)

client.on('roleCreate', async (role) => {
    await new Promise(r => setTimeout(r, 1000));
    const logs = await role.guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.RoleCreate });
    const log = logs.entries.first();
    const executor = (log && log.target.id === role.id) ? `<@${log.executor.id}>` : "ไม่ทราบชื่อ";
    const chan = client.channels.cache.get(ROLE_LOG_CHANNEL_ID);
    if(chan) chan.send({ embeds: [new EmbedBuilder().setTitle('🆕 สร้างยศใหม่').setColor(role.color).addFields({ name:'คนสร้าง', value: executor }, { name:'ชื่อยศ', value: role.name }).setTimestamp()] }).catch(()=>{});
});

client.on('roleDelete', async (role) => {
    await new Promise(r => setTimeout(r, 1000));
    const logs = await role.guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.RoleDelete });
    const log = logs.entries.first();
    const executor = (log && log.targetId === role.id) ? `<@${log.executor.id}>` : "ไม่ทราบ";
    const chan = client.channels.cache.get(ROLE_DELETE_LOG_ID);
    if(chan) chan.send({ content: `⚠️ ยศ **${role.name}** ถูกลบ`, embeds: [new EmbedBuilder().setTitle('🗑️ ลบยศ').setColor(0xFF0000).addFields({ name:'คนลบ', value: executor }, { name:'ยศที่ลบ', value: role.name }).setTimestamp()] }).catch(()=>{});
});

client.on('guildBanAdd', async (ban) => {
    await new Promise(r => setTimeout(r, 1500));
    const logs = await ban.guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.MemberBanAdd });
    const log = logs.entries.first();
    const executor = (log && log.target.id === ban.user.id) ? `<@${log.executor.id}>` : "ไม่ทราบ";
    const chan = client.channels.cache.get(BAN_LOG_CHANNEL_ID);
    if(chan) chan.send({ content: `🚨 **${ban.user.tag}** ถูกแบน`, embeds: [new EmbedBuilder().setTitle('🔨 แบนสมาชิก').setColor(0xFF0000).addFields({ name:'คนทำ', value: executor }, { name:'คนโดน', value: ban.user.tag }).setTimestamp()] }).catch(()=>{});
});
// (Unban, RoleUpdate, MemberUpdate events ใส่ไว้ตามเดิม หรือ copy จากอันเก่ามาแปะเพิ่มได้ครับ)


// ================= 5. Start Bot =================
client.once('ready', async () => {
    console.log(`✅ Logged in as ${client.user.tag}`);
    
    // --- ระบบซิงค์เลขห้องนับเลข (จากชื่อห้อง) ---
    try {
        const channel = await client.channels.fetch(TARGET_CHANNEL_ID);
        const parts = channel.name.split('-');
        const lastPart = parts[parts.length - 1];
        const extractedNumber = parseInt(lastPart);
        if (!isNaN(extractedNumber)) {
            currentCount = extractedNumber;
            console.log(`✅ ซิงค์เลขจากห้องสำเร็จ: ${currentCount}`);
        } else {
            console.log('⚠️ ไม่พบเลขในชื่อห้อง เริ่มนับ 0');
            currentCount = 0;
        }
    } catch (error) { console.error('❌ ดึงข้อมูลห้องผิดพลาด:', error); }

    client.user.setActivity('ThapxkornAX', { type: ActivityType.Streaming, url: 'https://www.twitch.tv/star_ssr' });
});

client.login(TOKEN);