use anchor_lang::prelude::*;

declare_id!("Esb1EUAFYCuUQmffqLmrMJT6kTExFHmrvjhCDV9AtZKs");

#[program]
pub mod tender {
    use super::*;
    
    pub fn init_tender(ctx: Context<InitTender>, name: String, description: String) -> Result<()> {
        ctx.accounts.tender.name = name;
        ctx.accounts.tender.description = description;
        ctx.accounts.tender.authority = *ctx.accounts.tender.to_account_info().key;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitTender<'info> {
    #[account(init, payer = user, space = 1024)]
    tender: Account<'info, Tender>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct Tender {
    pub authority: Pubkey,
    pub name: String,
    pub description: String,
}