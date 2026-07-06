import discord
from discord.ext import commands
import asyncio

intents = discord.Intents.default()
intents.message_content = True
intents.voice_states = True

bot = commands.Bot(command_prefix="!", intents=intents)

# 🎵 רשימת שירים (אפשר להחליף קישורים)
SONGS = {
    "שיר 1": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    "שיר 2": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    "שיר 3": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
}


class MusicView(discord.ui.View):
    def __init__(self):
        super().__init__()

        for name in SONGS:
            self.add_item(MusicButton(name))


class MusicButton(discord.ui.Button):
    def __init__(self, song_name):
        super().__init__(label=song_name, style=discord.ButtonStyle.primary)
        self.song_name = song_name

    async def callback(self, interaction: discord.Interaction):
        url = SONGS[self.song_name]

        voice_channel = interaction.user.voice.channel if interaction.user.voice else None

        if not voice_channel:
            await interaction.response.send_message("אתה חייב להיות ב־Voice!", ephemeral=True)
            return

        vc = interaction.guild.voice_client

        if vc and vc.is_connected():
            await vc.move_to(voice_channel)
        else:
            vc = await voice_channel.connect()

        vc.stop()

        source = discord.FFmpegPCMAudio(url)
        vc.play(source)

        await interaction.response.send_message(f"▶ מנגן עכשיו: {self.song_name}")


@bot.command()
async def music(ctx):
    await ctx.send("בחר שיר:", view=MusicView())


@bot.command()
async def stop(ctx):
    vc = ctx.voice_client
    if vc:
        await vc.disconnect()
        await ctx.send("⛔ עצרתי ויצאתי מהחדר")


bot.run("PUT_YOUR_TOKEN_HERE")
