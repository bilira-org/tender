use anchor_lang::prelude::*;
mod errors;

#[account]
pub struct Timer {
    pub t1: i64,
    pub t2: i64,
}

impl Timer {    
    pub fn init_timer(&mut self, period1: i64, period2: i64) -> Result<()> {
        // Get the current time.
        let current_time = Clock::get()?.unix_timestamp;
        let seconds_in_day = 60;
        
        // Calculate the time periods.
        self.t1 = current_time + period1 * seconds_in_day;
        self.t2 = self.t1 + period2 * seconds_in_day;

        Ok(())
    }
    pub fn is_bidding_time(&self) -> Result<()> {
        let now = Clock::get()?.unix_timestamp;
        if self.t1 < now {
            return Err(errors::ErrorCode::NotInBiddingPhase.into());
        }
        Ok(())
    }
    pub fn is_bid_validation_time(&self) -> Result<()> {
        let now = Clock::get()?.unix_timestamp;
        if self.t1 < now && self.t2 > now {
            return Ok(());
        }
        return Err(errors::ErrorCode::NotInBidValidationPhase.into());
    }
    pub fn is_end_time(&self) -> Result<()> {
        let now = Clock::get()?.unix_timestamp;
        if self.t2 > now  {
            return Err(errors::ErrorCode::TenderTimeNotEnded.into());
        }
        Ok(())
    }
}