use anchor_lang::prelude::*;

#[error_code]
pub enum ErrorCode {
    #[msg("You can not submit your bid outside the bidding phase.")]
    NotInBiddingPhase,
    #[msg("You can not reveal your bid outside the validation phase.")]
    NotInBidValidationPhase,
    #[msg("Tender is not finished yet.")]
    TenderTimeNotEnded
}