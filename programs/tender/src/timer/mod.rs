use anchor_lang::prelude::*;
mod errors;

#[account]
pub struct Timer {
    pub t1: u64,
    pub t2: u64,
}

impl Timer {    
    pub fn init_timer(&mut self, period1: u64, period2: u64) -> Result<()> {
        // Get the current time.
        let current_time = Clock::get()?.unix_timestamp as u64;
        let seconds_in_day = 60;
        
        // Calculate the time periods.
        self.t1 = current_time + period1 * seconds_in_day;
        self.t2 = self.t1 + period2 * seconds_in_day;

        Ok(())
    }
    pub fn is_bidding_time(&self) -> Result<()> {
        let now = Clock::get()?.unix_timestamp as u64;

        require!(self.t1 > now, errors::ErrorCode::NotInBiddingPhase);

        Ok(())
    }
    pub fn is_bid_validation_time(&self) -> Result<()> {
        let now = Clock::get()?.unix_timestamp as u64;

        require!(self.t1 < now && now < self.t2, errors::ErrorCode::NotInBidValidationPhase);
        
        Ok(())
    }
    pub fn is_end_time(&self) -> Result<()> {
        let now = Clock::get()?.unix_timestamp as u64;

        require!(self.t2 < now, errors::ErrorCode::TenderTimeNotEnded);
        
        Ok(())
    }
}