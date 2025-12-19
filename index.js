/***********************
 *  LOAD ENV + SERVER
 ***********************/
require('dotenv').config();
const express = require('express');
const app = express();
const port = process.env.PORT || 10000;

app.get('/', (req, res) => res.send('Bot is online!'));
app.listen(port, '0.0.0.0', () => {
    console.log(`Server running on port ${port}`);
});

/***********************
 *  DISCORD IMPORTS
 ***********************/
const {
    Client,
    GatewayIntentBits,
    ActivityType,
    PermissionsBitField,
    PermissionFlagsBits,
    ChannelType,
    Collection,
    EmbedBuilder,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    ButtonBuilder,
    ButtonStyle,
    AuditLogEvent,
    MessageFlags,
    time
} = require('discord.js');

const {
    joinVoiceChannel,
    entersState,
    VoiceConnectionStatus
} = require('@discordjs/voice');

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

const { products, farmPackages } = require('./config.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildModeration,
        GatewayIntentBits.GuildVoiceStates
    ]
});

client.commands = new Collection();

function translatePerms(bitfield) {
    const p = new PermissionsBitField(bitfield);
    const list = [];
    if (p.has(PermissionsBitField.Flags.Administrator)) list.push('⭐ ผู้ดูแลระบบ');
    if (p.has(PermissionsBitField.Flags.ManageGuild)) list.push('จัดการเซิร์ฟเวอร์');
    if (p.has(PermissionsBitField.Flags.ManageRoles)) list.push('จัดการยศ');
    if (p.has(PermissionsBitField.Flags.ManageChannels)) list.push('จัดการห้อง');
    if (p.has(PermissionsBitField.Flags.BanMembers)) list.push('แบนสมาชิก');
    return list.length ? list.join(', ') : 'สิทธิ์ทั่วไป';
}

client.on('interactionCreate', async interaction => {

    if (interaction.isStringSelectMenu()) {
        let selected = null;

        if (interaction.customId === 'select_product') {
            selected = products[interaction.values[0]];
        }
        if (interaction.customId === 'select_farm') {
            selected = farmPackages[interaction.values[0]];
        }

        if (!selected) return;

        const embed = new EmbedBuilder()
            .setTitle(`✨ ${selected.name}`)
            .setColor('#f1c40f')
            .setDescription(
`💰 **ราคา:** ${selected.price}

${selected.description}

${selected.details ?? ''}`
            )
            .setImage(selected.img ?? null);

        return interaction.reply({
            embeds: [embed],
            ephemeral: true
        });
    }

    /* ---------- CLOSE ROOM ---------- */
    if (interaction.isButton() && interaction.customId === 'close_room') {
        const ALLOWED_USER_IDS = ['1390444294988369971', '774417760281165835', '1056886143754444840'];
        const isStaff = interaction.member.roles.cache.has(STAFF_ROLE_ID);

        if (!isStaff && !ALLOWED_USER_IDS.includes(interaction.user.id)) {
            return interaction.reply({
                content: '❌ เฉพาะทีมงานเท่านั้น',
                ephemeral: true
            });
        }

        await interaction.reply({ content: '🔒 ลบห้องใน 3 วินาที...' });
        setTimeout(() => interaction.channel.delete().catch(() => {}), 3000);
        return;
    }

    /* ---------- ROOM SETUP ---------- */
    if (!interaction.isStringSelectMenu() || interaction.customId !== 'room_setup') return;

    await interaction.deferReply({ ephemeral: true });

    const { guild, user } = interaction;
    const value = interaction.values[0];

    let channelName = '';
    let typeName = '';
    let embed = new EmbedBuilder().setColor('#2ecc71');
    let rows = [];

    const overwrites = [
        { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] },
        { id: user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
        { id: STAFF_ROLE_ID, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] }
    ];

    if (value === 'create_item') {
        typeName = '🛒 ซื้อของ';
        channelName = `🧺-ซื้อของ-${user.username}`;
        embed.setTitle('🛒 ร้านค้า').setDescription('เลือกสินค้าที่ต้องการ');

        rows.push(new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('select_product')
                .setPlaceholder('เลือกสินค้า')
                .addOptions(Object.keys(products).map(k => ({
                    label: products[k].name,
                    value: k,
                    description: `ราคา ${products[k].price}`,
                    emoji: products[k].emoji
                })))
        ));
    }

    if (value === 'create_farm') {
        typeName = '⚔️ จ้างฟาร์ม';
        channelName = `🎮-จ้างฟาร์ม-${user.username}`;
        embed.setTitle('⚔️ จ้างฟาร์ม');

        rows.push(new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('select_farm')
                .setPlaceholder('เลือกแพ็กเกจ')
                .addOptions(Object.keys(farmPackages).map(k => ({
                    label: farmPackages[k].name,
                    value: k,
                    description: `ราคา ${farmPackages[k].price}`,
                    emoji: farmPackages[k].emoji
                })))
        ));
    }

    if (value === 'create_trade') {
        typeName = '🤝 ติดต่อพ่อค้า';
        channelName = `🙆‍♂️-ติดต่อพ่อค้า-${user.username}`;
        embed.setTitle('🤝 ติดต่อพ่อค้า');
    }

    const channel = await guild.channels.create({
        name: channelName,
        type: ChannelType.GuildText,
        parent: TARGET_CATEGORY_ID,
        permissionOverwrites: overwrites
    });

    rows.push(new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('close_room')
            .setLabel('ปิดห้อง')
            .setStyle(ButtonStyle.Danger)
            .setEmoji('🔒')
    ));

    await channel.send({
        content: `👋 ${user}`,
        embeds: [embed],
        components: rows
    });

    await interaction.editReply({ content: `✅ สร้างห้องแล้ว: ${channel}` });

});

client.once('ready', () => {
    console.log(`✅ Logged in as ${client.user.tag}`);

    client.user.setActivity('ThapxkornAX', {
        type: ActivityType.Streaming,
        url: 'https://www.twitch.tv/star_ssr'
    });

    const guildId = '1376283535962406942';
    const channelId = '1428553701076766802';
    const guild = client.guilds.cache.get(guildId);

    if (!guild) return;

    const connection = joinVoiceChannel({
        channelId,
        guildId,
        adapterCreator: guild.voiceAdapterCreator,
        selfMute: true,
        selfDeaf: true
    });

    connection.on(VoiceConnectionStatus.Disconnected, async () => {
        try {
            await Promise.race([
                entersState(connection, VoiceConnectionStatus.Signalling, 5_000),
                entersState(connection, VoiceConnectionStatus.Connecting, 5_000),
            ]);
        } catch {
            connection.destroy();
        }
    });
});


client.login(TOKEN);