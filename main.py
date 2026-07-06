import os
import discord
from discord.ext import commands

intents = discord.Intents.default()
intents.message_content = True

bot = commands.Bot(command_prefix="!", intents=intents)


class MusicSelect(discord.ui.Select):
    def __init__(self):
        options = [
            discord.SelectOption(
                label="פאנל פשוט",
                description="פאנל בסיסי למשתמשים",
                emoji="🎵"
            ),
            discord.SelectOption(
                label="פאנל מתקדם",
                description="פאנל עם כל האפשרויות",
                emoji="⚡"
            )
        ]

        super().__init__(
            placeholder="בחר סוג פאנל...",
            options=options
        )

    async def callback(self, interaction: discord.Interaction):
        embed = discord.Embed(
            title="🎶 Music Panel",
            description=f"בחרת: **{self.values[0]}**",
            color=discord.Color.blue()
        )

        await interaction.response.edit_message(embed=embed, view=MusicView())


class MusicView(discord.ui.View):
    def __init__(self):
        super().__init__(timeout=None)
        self.add_item(MusicSelect())

    @discord.ui.button(label="▶ נגן", style=discord.ButtonStyle.green)
    async def play(self, interaction: discord.Interaction, button: discord.ui.Button):
        await interaction.response.send_message("▶ לחצת על נגן", ephemeral=True)

    @discord.ui.button(label="⏸ השהה", style=discord.ButtonStyle.blurple)
    async def pause(self, interaction: discord.Interaction, button: discord.ui.Button):
        await interaction.response.send_message("⏸ לחצת על השהה", ephemeral=True)

    @discord.ui.button(label="⏭ דלג", style=discord.ButtonStyle.gray)
    async def skip(self, interaction: discord.Interaction, button: discord.ui.Button):
        await interaction.response.send_message("⏭ לחצת על דלג", ephemeral=True)

    @discord.ui.button(label="⏹ עצור", style=discord.ButtonStyle.red)
    async def stop(self, interaction: discord.Interaction, button: discord.ui.Button):
        await interaction.response.send_message("⏹ לחצת על עצור", ephemeral=True)


@bot.event
async def on_ready():
    print(f"✅ {bot.user} מחובר!")


@bot.command(name="setup")
@commands.has_permissions(administrator=True)
async def setup(ctx):
    embed = discord.Embed(
        title="🎵 Music Control Panel",
        description="בחר אפשרות מהתפריט למטה.",
        color=discord.Color.blue()
    )

    await ctx.send(embed=embed, view=MusicView())


TOKEN = os.getenv("TOKEN")

if not TOKEN:
    print("❌ TOKEN לא נמצא")
else:
    bot.run(TOKEN)
