use anchor_lang::prelude::*;
use std::collections::HashMap;
mod timer;
mod helpers;
declare_id!("Esb1EUAFYCuUQmffqLmrMJT6kTExFHmrvjhCDV9AtZKs");

#[program]
pub mod tender {
    use super::*;
    
    pub fn init_tender(ctx: Context<InitTender>, name: String, description: String, period1: u64, period2: u64, tender_hash: String) -> Result<()> {
        // Initialize the timer.
        ctx.accounts.tender.timer.init_timer(period1, period2).unwrap();
        
        ctx.accounts.tender.name = name;
        ctx.accounts.tender.description = description;
        ctx.accounts.tender.authority = *ctx.accounts.tender.to_account_info().key;
        // Cast the tender hash to a buffer.
        ctx.accounts.tender.hash = helpers::string_hex_to_buffer(tender_hash);
        ctx.accounts.tender.finished = false;

        Ok(())
    }

    pub fn get_time(ctx: Context<GetTime>) -> Result<()> {
        let tender_account = &mut ctx.accounts.tender;
        let timer = &tender_account.timer;

        msg!("t1: {}", timer.t1);
        msg!("t2: {}", timer.t2);

        Ok(())
    }

    pub fn make_bid(ctx: Context<Instruction>, bid_hash: String) -> Result<()> {
        let tender_account = &mut ctx.accounts.tender;
        
        // Make sure the user is not bidding on their own tender.
        assert!(tender_account.authority != *ctx.accounts.user.key, "You can not bid on your own tender.");
        
        let timer = &tender_account.timer;

        timer.is_bidding_time().unwrap();

        tender_account.upsert_bid(*ctx.accounts.user.key, bid_hash.clone());

        // Emit the event.
        emit!(BidMade {
            account: *ctx.accounts.user.key,
            bid_hash: bid_hash,
        });

        Ok(())
    }

    pub fn validate_bid(ctx: Context<Instruction>, amount: u64, random_string: String) -> Result<()> {
        let tender_account = &mut ctx.accounts.tender;
        
        // Make sure the user is not validating their own bid on their own tender.
        assert!(tender_account.authority != *ctx.accounts.user.key, "You can not validate bid on your own tender.");

        let timer = &tender_account.timer;

        timer.is_bid_validation_time().unwrap();

        tender_account.is_bid_valid(*ctx.accounts.user.key, amount, random_string).unwrap();
        
        // If the bid is the lowest bid, update the winner and the best bid.
        if amount < tender_account.best_bid || tender_account.best_bid == 0  {
            tender_account.best_bid = amount;
            tender_account.winner = *ctx.accounts.user.key;

            // Emit the event.
            emit!(NewWinner {
                account: *ctx.accounts.user.key,
                amount: amount,
            });
        }

        Ok(())
    }

    pub fn end_tender(ctx: Context<Instruction>, min: u64, max: u64, estimated: u64, random_string: String) -> Result<()> {
        let tender_account = &mut ctx.accounts.tender;

        // Make sure the user is the tender owner.
        assert!(tender_account.authority == *ctx.accounts.user.key, "Only tender owner can end the tender.");

        let timer = &tender_account.timer;

        timer.is_end_time().unwrap();

        tender_account.is_tender_valid(min, max, estimated, random_string).unwrap();

        // Update the tender_account with the revealed values.
        tender_account.minimum = min;
        tender_account.maximum = max;
        tender_account.estimated = estimated;
        tender_account.finished = true;

        // Set the tender status.
        let mut tender_status = "Tender success";
        if tender_account.best_bid < min || tender_account.best_bid > max {
            tender_status = "Tender failed";
        }

        // Emit the event.
        emit!(TenderEnded {
            min: min,
            max: max,
            estimated: estimated,
            tender_status: tender_status.to_string(),
        });

        Ok(())
    }
    
    pub fn get_winner(ctx: Context<GetWinner>) -> Result<()> {
        let tender_account = &mut ctx.accounts.tender;

        let timer = &tender_account.timer;

        timer.is_end_time().unwrap();

        // Set the tender status.
        let mut tender_status = "Tender success";
        if tender_account.best_bid < tender_account.minimum || tender_account.best_bid > tender_account.maximum {
            tender_status = "Tender failed";
        }

        msg!("Winner: {}", tender_account.winner);
        msg!("Best bid: {}", tender_account.best_bid);
        msg!("Tender status: {}", tender_status);

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
    pub minimum: u64,
    pub maximum: u64,
    pub estimated: u64,
    pub hash: [u8; 32],
    pub best_bid: u64,
    pub winner: Pubkey,
    pub finished: bool,
    pub timer: timer::Timer,
    pub bids: HashMap<Pubkey, [u8; 32]>,
}

impl Tender {
    pub fn upsert_bid(&mut self, user_pubkey: Pubkey, bid_hash: String)  {
        self.bids.insert(user_pubkey, helpers::string_hex_to_buffer(bid_hash));
    }
    pub fn is_bid_valid(&mut self, user_pubkey: Pubkey, amount: u64, random_string: String) -> Result<()> {
        // Check if the bid is created by the user.
        assert!(self.bids.contains_key(&user_pubkey), "Your bid not found.");
        
        // Get the bid hash.
        let bid_hash = self.bids.get(&user_pubkey).unwrap();
        
        // Concatenate the string.
        let mut str_to_hash: String = String::new();

        str_to_hash.push_str(&amount.to_string());
        str_to_hash.push_str("-");
        str_to_hash.push_str(&random_string);

        // Hash the string.
        let result_hash = &helpers::hash_with_keccak256(str_to_hash);

        // Check if the hash matches the bid hash.
        assert!(bid_hash == result_hash, "Your bid hash does not match.");

        // Reveal the bid.
        let mut array: [u8; 32] = [0; 32];
        array[0..8].copy_from_slice(&amount.to_le_bytes());

        self.bids.insert(user_pubkey, array);

        Ok(())
    }
    pub fn is_tender_valid(&mut self, min: u64, max: u64, estimated: u64, random_string: String) -> Result<()> {
        // Concatenate the values and hash them.
        let mut str_to_hash: String = String::new();

        str_to_hash.push_str(&min.to_string());
        str_to_hash.push_str("-");
        str_to_hash.push_str(&max.to_string());
        str_to_hash.push_str("-");
        str_to_hash.push_str(&estimated.to_string());
        str_to_hash.push_str("-");
        str_to_hash.push_str(&random_string);

        // Hash the string.
        let result_hash = &helpers::hash_with_keccak256(str_to_hash);

        // Check if the hash matches the tender hash.
        assert!(self.hash == result_hash.as_slice(), "Tender hash does not match.");

        Ok(())
    }
}

#[event]
pub struct BidMade {
    pub account: Pubkey,
    pub bid_hash: String,
}
#[event]
pub struct NewWinner {
    pub account: Pubkey,
    pub amount: u64,
}
#[event]
pub struct TenderEnded {
    pub min: u64,
    pub max: u64,
    pub estimated: u64,
    pub tender_status: String,
}