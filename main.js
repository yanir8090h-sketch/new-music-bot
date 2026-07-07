const {
    Client,
    GatewayIntentBits,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle
} = require("discord.js");

const {
    joinVoiceChannel,
    createAudioPlayer,
    createAudioResource,
    AudioPlayerStatus
} = require("@discordjs/voice");

const play = require("play-dl");

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates
    ]
});

const PREFIX = "m!";

let players = new Map();
let queues = new Map();
let volumes = new Map();


client.once("ready", () => {
    console.log(`✅ מחובר בתור ${client.user.tag}`);
});


// פקודה m!p
client.on("messageCreate", async message => {

    if (message.author.bot) return;

    if (message.content === "m!p") {

        const embed = new EmbedBuilder()
            .setColor("#5865F2")
            .setTitle("🎵 Music Player")
            .setDescription(
                "בחר פעולה:\n\n" +
                "🎶 נגן שיר\n" +
                "⏸ השהה\n" +
                "▶ המשך\n" +
                "⏭ דלג\n" +
                "🔊 ווליום"
            );


        const row = new ActionRowBuilder()
            .addComponents(

                new ButtonBuilder()
                    .setCustomId("play")
                    .setLabel("🎵 נגן שיר")
                    .setStyle(ButtonStyle.Success),

                new ButtonBuilder()
                    .setCustomId("pause")
                    .setLabel("⏸ השהה")
                    .setStyle(ButtonStyle.Primary),

                new ButtonBuilder()
                    .setCustomId("resume")
                    .setLabel("▶ המשך")
                    .setStyle(ButtonStyle.Success),

                new ButtonBuilder()
                    .setCustomId("skip")
                    .setLabel("⏭ דלג")
                    .setStyle(ButtonStyle.Secondary)

            );


        const row2 = new ActionRowBuilder()
            .addComponents(

                new ButtonBuilder()
                    .setCustomId("volume")
                    .setLabel("🔊 ווליום")
                    .setStyle(ButtonStyle.Primary),

                new ButtonBuilder()
                    .setCustomId("stop")
                    .setLabel("⛔ עצור")
                    .setStyle(ButtonStyle.Danger)

            );


        await message.channel.send({
            embeds: [embed],
            components: [row, row2]
        });
    }

});
client.on("interactionCreate", async interaction => {

    if (interaction.isButton()) {


        // פתיחת חלון כתיבת שיר
        if (interaction.customId === "play") {

            const modal = new ModalBuilder()
                .setCustomId("song_modal")
                .setTitle("🎵 חיפוש שיר");


            const input = new TextInputBuilder()
                .setCustomId("song_name")
                .setLabel("רשום שם של שיר")
                .setStyle(TextInputStyle.Short)
                .setRequired(true);


            modal.addComponents(
                new ActionRowBuilder().addComponents(input)
            );


            return interaction.showModal(modal);
        }



        const data = players.get(interaction.guild.id);


        if (!data) {
            return interaction.reply({
                content: "❌ אין מוזיקה פעילה",
                ephemeral: true
            });
        }



        if (interaction.customId === "pause") {

            data.player.pause();

            return interaction.reply({
                content: "⏸ השיר הושהה",
                ephemeral: true
            });
        }



        if (interaction.customId === "resume") {

            data.player.unpause();

            return interaction.reply({
                content: "▶ המשכתי",
                ephemeral: true
            });
        }



        if (interaction.customId === "skip") {

            data.player.stop();

            return interaction.reply({
                content: "⏭ דילגתי",
                ephemeral: true
            });
        }



        if (interaction.customId === "stop") {

            data.connection.destroy();

            players.delete(interaction.guild.id);
            queues.delete(interaction.guild.id);

            return interaction.reply({
                content: "⛔ עצרתי ויצאתי",
                ephemeral: true
            });
        }




        if (interaction.customId === "volume") {

            if (!data.resource) {
                return interaction.reply({
                    content: "❌ אין שיר מתנגן",
                    ephemeral: true
                });
            }


            data.resource.volume.setVolume(0.5);


            return interaction.reply({
                content: "🔊 ווליום 50%",
                ephemeral: true
            });
        }

    }



    // קבלת שם שיר
    if (interaction.isModalSubmit()) {


        if (interaction.customId === "song_modal") {


            const song =
                interaction.fields.getTextInputValue("song_name");


            await interaction.deferReply({
                ephemeral: true
            });


            await addSong(
                interaction,
                song
            );


        }
    }

});
client.login(process.env.TOKEN);
