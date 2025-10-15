import { AllFlowsPrecondition } from '@sapphire/framework';
import type { CommandInteraction, ContextMenuCommandInteraction, Message, Snowflake } from 'discord.js';

export class TeamLeadOnly extends AllFlowsPrecondition {
	#message = 'Bu komut sadece takım liderleri tarafından kullanılabilir';

	public override async chatInputRun(interaction: CommandInteraction) {
		const res = await this.doTeamLeadCheck(interaction.member!.user.id);
		return res ? this.ok() : this.error({ message: this.#message });
	}

	public override async contextMenuRun(interaction: ContextMenuCommandInteraction) {
		const res = await this.doTeamLeadCheck(interaction.member!.user.id);
		return res ? this.ok() : this.error({ message: this.#message });
	}

	public override async messageRun(message: Message) {
		const res = await this.doTeamLeadCheck(message.member!.id);
		return res ? this.ok() : this.error({ message: this.#message });
	}

	private async doTeamLeadCheck(userId: Snowflake) {
		const teamByLeaderId = await this.container.db.jamTeamMember.findFirst({
			where: {
				userID: userId
			}
		});

		return !!teamByLeaderId;
	}
}

declare module '@sapphire/framework' {
	interface Preconditions {
		OwnerOnly: never;
		TeamLeadOnly: never;
	}
}
