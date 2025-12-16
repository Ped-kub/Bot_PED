const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('เช็คความเร็วการตอบกลับของบอท'),
    async execute(interaction) {
        await interaction.reply(`ก๊าบ (Latency: ${interaction.client.ws.ping}ms)`);
    },
};