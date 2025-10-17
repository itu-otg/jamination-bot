import { ApplyOptions } from '@sapphire/decorators';
import { Command } from '@sapphire/framework';
import { ChannelType, EmbedBuilder, PermissionFlagsBits } from 'discord.js';

@ApplyOptions<Command.Options>({
	name: 'takım-oluştur',
	description: 'Takım oluşturmak için bu komutu kullanın!',
	preconditions: ['NotInTeam', 'GuildOnly']
})
export class UserCommand extends Command {
	#successEmbed = new EmbedBuilder()
		.setTitle('Takım oluşturuldu!')
		.setColor(0x7f91bd)
		.setFooter({ text: 'Jamination Bot', iconURL: this.container.client.user?.displayAvatarURL() ?? undefined });

	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand((builder) =>
			builder
				.setName(this.name)
				.setDescription(this.description)
				.addStringOption((opt) => opt.setName('team-name').setDescription('Takım adı').setRequired(true))
		);
	}

	public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		// FIXME: Remove this after j8;
		await interaction.deferReply(); // Defer first to avoid double reply errors

		const teamName = interaction.options.getString('team-name', true);
		await this.generateTeam(interaction, teamName);
	}

	private async generateTeam(interaction: Command.ChatInputCommandInteraction, teamName: string) {
		const guildSettings = await this.container.db.guildSettings.findFirst({
			where: { guildID: interaction.guildId! }
		});

		if (!guildSettings?.jamPositionateChannelID) {
			return interaction.editReply({
				content: 'Komutu kullanabilmek için önce jam modunun aktif olmasını beklemelisiniz.'
			});
		}

		const resolvedChannel = await interaction.guild?.channels.fetch(guildSettings.jamPositionateChannelID);
		if (!resolvedChannel || resolvedChannel.type !== ChannelType.GuildCategory) {
			return interaction.editReply({ content: 'Kategori bulunamadı veya geçersiz.' });
		}

		try {
			const category = await interaction.guild!.channels.create({
				name: teamName,
				type: ChannelType.GuildCategory,
				position: resolvedChannel.position + 1,
				permissionOverwrites: [
					{
						id: interaction.guild!.roles.everyone.id,
						deny: [PermissionFlagsBits.ViewChannel]
					}
				]
			});

			const textChannel = await interaction.guild!.channels.create({
				name: `${teamName} - Assets`,
				type: ChannelType.GuildText,
				parent: category.id
			});

			const voiceChannel = await interaction.guild!.channels.create({
				name: `${teamName} - Konuşma`,
				type: ChannelType.GuildVoice,
				parent: category.id,
				position: textChannel.position + 1
			});

			const role = await interaction.guild!.roles.create({
				name: teamName,
				color: 'DarkPurple'
			});

			// Update category permissions for the team role
			await category.permissionOverwrites.set([
				{
					id: role.id,
					allow: [
						PermissionFlagsBits.ViewChannel,
						PermissionFlagsBits.SendMessages,
						PermissionFlagsBits.AddReactions,
						PermissionFlagsBits.AttachFiles,
						PermissionFlagsBits.UseExternalEmojis,
						PermissionFlagsBits.Connect,
						PermissionFlagsBits.Speak,
						PermissionFlagsBits.Stream,
						PermissionFlagsBits.UseVAD,
						PermissionFlagsBits.ManageMessages,
						PermissionFlagsBits.MoveMembers,
						PermissionFlagsBits.UseSoundboard,
						PermissionFlagsBits.EmbedLinks,
						PermissionFlagsBits.SendPolls,
						PermissionFlagsBits.UseExternalSounds,
						PermissionFlagsBits.UseExternalStickers,
						PermissionFlagsBits.SendVoiceMessages
					]
				},
			]);

      await textChannel.lockPermissions();
      await voiceChannel.lockPermissions();

			const initialMember = { userID: interaction.user.id, role: 'Takım Lideri', isTeamLeader: true };
			const member = await interaction.guild!.members.fetch(interaction.user.id);

			await member.roles.add(role);

			await this.container.db.jamTeam.create({
				data: {
					guildID: interaction.guildId!,
					name: teamName,
					categoryID: category.id,
					textChannelID: textChannel.id,
					voiceChannelID: voiceChannel.id,
					discordRoleID: role.id,
					members: {
						create: [initialMember]
					}
				}
			});

			// Send final success embed
			return interaction.editReply({
				embeds: [this.#successEmbed.setDescription(`Takımınız **${teamName}** başarıyla oluşturuldu!`)]
			});
		} catch (error) {
			this.container.logger.error(error);
			return interaction.editReply({
				content: 'Bir hata oluştu, lütfen tekrar deneyin veya moderatör desteği isteyin!'
			});
		}
	}
}
