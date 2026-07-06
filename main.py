import discord
from discord.ext import commands

intents = discord.Intents.default()
intents.message_content = True

bot = commands.Bot(command_prefix="!", intents=intents)

SONGS = {
    "שיר 1": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "שיר 2": "https://www.youtube.com/watch?v=3JZ_D3ELwOQ",
    "שיר 3": "https://www.youtube.com/watch?v=2Vv-BfVoq4g",
}

class MusicView(discord.ui.View):
    def __init__(self):
        super().__init__()

        for name, link in SONGS.items():
            self.add_item(MusicButton(name, link))


class MusicButton(discord.ui.Button):
    def __init__(self, name, link):
        super().__init__(label=name, style=discord.ButtonStyle.primary)
        self.link = link
        self.song_name = name

    async def callback(self, interaction: discord.Interaction):
        await interaction.response.send_message(
            f"🎵 בחרת: **{self.song_name}**\n🔗 פתח לשמיעה: {self.link}"
        )


@bot.command()
async def music(ctx):
    await ctx.send("בחר שיר:", view=MusicView())


bot.run("TOKEN_HERE")
