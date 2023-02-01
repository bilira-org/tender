use anchor_lang::prelude::*;
mod timer;
declare_id!("Esb1EUAFYCuUQmffqLmrMJT6kTExFHmrvjhCDV9AtZKs");

#[program]
pub mod tender {
    use super::*;
    
    pub fn init_tender(ctx: Context<InitTender>, name: String, description: String, period1: i64, period2: i64) -> Result<()> {
        ctx.accounts.tender.name = name;
        ctx.accounts.tender.description = description;
        ctx.accounts.tender.authority = *ctx.accounts.tender.to_account_info().key;
        ctx.accounts.tender.timer.init_timer(period1, period2).unwrap();
        
        Ok(())
    }

    pub fn get_time(ctx: Context<GetTime>) -> Result<()> {
        let tender_account = &mut ctx.accounts.tender;
        let timer = &tender_account.timer;

        msg!("t1: {}", timer.t1);
        msg!("t2: {}", timer.t2);

        Ok(())
    }

    pub fn make_bid(ctx: Context<Instruction>) -> Result<()> {
        let tender_account = &mut ctx.accounts.tender;
        
        assert!(tender_account.authority != *ctx.accounts.user.key, "You can not bid on your own tender.");
        
        let timer = &tender_account.timer;

        timer.is_bidding_time().unwrap();

        Ok(())
    }

    pub fn validate_bid(ctx: Context<Instruction>) -> Result<()> {
        let tender_account = &mut ctx.accounts.tender;
        
        assert!(tender_account.authority != *ctx.accounts.user.key, "You can not validate bid on your own tender.");

        let timer = &tender_account.timer;

        timer.is_bid_validation_time().unwrap();

        Ok(())
    }

    pub fn end_tender(ctx: Context<Instruction>) -> Result<()> {
        let tender_account = &mut ctx.accounts.tender;

        assert!(tender_account.authority == *ctx.accounts.user.key, "Only tender owner can end the tender.");

        let timer = &tender_account.timer;

        timer.is_end_time().unwrap();

        Ok(())
    }
    
    pub fn get_winner(ctx: Context<GetWinner>) -> Result<()> {
        let tender_account = &mut ctx.accounts.tender;

        let timer = &tender_account.timer;

        timer.is_end_time().unwrap();

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

#[derive(Accounts)]
pub struct GetTime<'info> {
    #[account(mut)]
    tender: Account<'info, Tender>,
}

#[derive(Accounts)]
pub struct Instruction<'info> {
    #[account(mut)]
    tender: Account<'info, Tender>,
    pub user: Signer<'info>,
}

#[derive(Accounts)]
pub struct GetWinner<'info> {
    #[account(mut)]
    tender: Account<'info, Tender>,
}

#[account]
pub struct Tender {
    pub authority: Pubkey,
    pub name: String,
    pub description: String,
    pub timer: timer::Timer,
}