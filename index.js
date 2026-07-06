const { Client, GatewayIntentBits, createAudioPlayer, createAudioResource, joinVoiceChannel } = require('discord.js');
const play = require('play-dl');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildVoiceStates
    ]
});

client.on('ready', () => {
    console.log(`✅ הבוט מחובר כעת בתור ${client.user.tag}`);
});

client.on('interactionCreate', async (interaction) => {
    if (interaction.customId === 'music_modal') {
        const songName = interaction.fields.getTextInputValue('song_input');

        const voiceChannel = interaction.member.voice.channel;
        if (!voiceChannel) {
            return await interaction.reply({ content: '❌ אתה חייב להיות בערוץ קול כדי להפעיל מוזיקה!', ephemeral: true });
        }

        await interaction.deferReply({ ephemeral: true });

        try {
            const connection = joinVoiceChannel({
                channelId: voiceChannel.id,
                guildId: voiceChannel.guild.id,
                adapterCreator: voiceChannel.guild.voiceAdapterCreator,
            });

            const player = createAudioPlayer();

            let yt_info = await play.search(songName, { limit: 1 });
            if (!yt_info || yt_info.length === 0) {
                return await interaction.editReply({ content: '❌ לא מצאתי שיר בשם הזה!', ephemeral: true });
            }

            const video = yt_info;

            let stream = await play.stream(video.url);
            const resource = createAudioResource(stream.stream, {
                inputType: stream.type,
                inlineVolume: true
            });

            connection.subscribe(player);
            player.play(resource);

            await interaction.editReply({ content: `🎶 הבוט מזרים כעת בהצלחה בחדר הקול את השיר: **${video.title}** מותאם בבטחה על ידי: ${interaction.user}`, ephemeral: true });

        } catch (error) {
            console.error(error);
            await interaction.editReply({ content: '❌ אירעה שגיאה בהפעלת השיר!', ephemeral: true });
        }
    }
});

client.login(process.env.TOKEN);
