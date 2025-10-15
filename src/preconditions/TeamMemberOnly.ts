import { AllFlowsPrecondition } from '@sapphire/framework';
import type { CommandInteraction, ContextMenuCommandInteraction, Message, Snowflake } from 'discord.js';

export class TeamMemberOnly extends AllFlowsPrecondition {
	#message = 'Bu komut sadece bir takıma dahilseniz kullanılabilir';

	public override async chatInputRun(interaction: CommandInteraction) {
		const res = await this.doTeamCheck(interaction.member!.user.id);
		return res ? this.ok() : this.error({ message: this.#message });
	}

	public override async contextMenuRun(interaction: ContextMenuCommandInteraction) {
		const res = await this.doTeamCheck(interaction.member!.user.id);
		return res ? this.ok() : this.error({ message: this.#message });
	}

	public override async messageRun(message: Message) {
		const res = await this.doTeamCheck(message.member!.id);
		return res ? this.ok() : this.error({ message: this.#message });
	}

	private async doTeamCheck(userId: Snowflake) {
		const teamByMemberId = await this.container.db.jamTeam.findFirst({
			where: {
        members: {
          some: {
            userID: userId
          }        
        }
			}
		});

		return !!teamByMemberId;
	}
}

