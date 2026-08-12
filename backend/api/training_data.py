"""Labelled corpus for the phishing classifier.

Label 1 = phishing/scam, label 0 = legitimate.

The corpus deliberately spans the delivery channels the product actually scans
(email, SMS, WhatsApp, social DMs) and includes the two cases a small corpus
usually gets wrong:

  * legitimate messages that *look* like phishing — real security alerts, real
    delivery notices, real invoices. Without these the model learns that the
    word "verify" alone means fraud and floods users with false positives.
  * scams that carry none of the classic urgency markers — slow-burn romance,
    investment, and job scams that read calmly.

Keep both classes roughly balanced when adding examples; a skewed corpus shifts
the decision threshold rather than improving accuracy.
"""

PHISHING_SAMPLES = [
    # ── Credential harvesting / account security pretexts ───────────────────
    "URGENT: Your bank account has been suspended due to suspicious activity. Verify now at http://secure-bank-login.net",
    "Dear customer, we detected an unauthorized login attempt from Russia. If this wasn't you, reset your password immediately at https://security-verification-net.com/login",
    "Your Apple ID has been locked for security reasons. Unlock your profile now by verifying your credentials: http://apple-verification-support.com",
    "Your Microsoft password expires today. Keep the same password by confirming your corporate login here: http://microsoft-login-verify.com",
    "Verify your identity immediately to prevent permanent account deletion. Click here to confirm: http://verify-identity-link.com",
    "We noticed unusual sign-in activity on your Google account. Confirm it was you by entering your password at http://google-account-confirm.co",
    "Your mailbox storage is full and outgoing mail has been disabled. Re-validate your credentials here to restore service: http://webmail-quota-fix.info",
    "Security notice: your Office 365 session has expired. Sign in again to continue: http://office365-session-renew.com",
    "Attention: your online banking token has been deactivated. Reactivate within 12 hours at http://ib-token-reactivate.net or lose access.",
    "Your account will be permanently closed today unless you re-confirm your details. Final notice: http://final-account-notice.org",
    "Someone tried to change your password. If this was not you, secure your account now: http://secure-now-verify.click",
    "Your two-factor device was reset. Confirm this change with your login details at http://2fa-reset-confirm.info",
    "Immediate action required: Confirm your social security number to reactivate your employee benefits profile.",
    "HR notice: your payroll direct deposit failed. Re-enter your bank routing details here: http://payroll-deposit-fix.com",
    "Your VPN certificate expires tonight. Download the renewal tool and sign in to continue remote access: http://vpn-cert-renew.info",

    # ── Financial bait: prizes, refunds, invoices ──────────────────────────
    "CONGRATULATIONS! You have won a $1,000 Walmart Gift Card! Claim your reward now by clicking here: http://win-giftcard.xyz",
    "Tax refund alert: You are eligible for a tax refund of $432.10. Claim your credit immediately by filling out this form: http://irs-refund-portal.org",
    "Your credit card has been charged $1,250.00 for Amazon purchases. If you did not make this transaction, dispute it immediately: http://amazon-dispute-portal.net",
    "Dear client, your PayPal invoice #4829 for $599.99 is ready. Click here to cancel if this was a mistake: http://paypal-billing-cancel.com",
    "You have an unclaimed refund of $189.40 from your electricity provider. Submit your bank details to receive it: http://utility-refund-claim.info",
    "Final reminder: Invoice #827392 from Geek Squad for $399.99 will auto-renew today. To cancel call 1-888-555-0142 immediately.",
    "Your Netflix account payment failed. Please update your billing information within 24 hours to avoid suspension: http://netflix-billing-update.com",
    "Your Spotify Premium payment was declined. Update your card now to keep your playlists: http://spotify-billing-retry.xyz",
    "You are the lucky winner of our monthly draw! Pay the small $25 processing fee to release your $50,000 prize.",
    "Your insurance claim has been approved for $3,400. Confirm your account number to receive the payout: http://claims-payout-confirm.co",
    "ALERT: A payment of $980 to an unknown merchant is pending on your card. Cancel it here within 30 minutes: http://card-cancel-payment.info",
    "You have 2,450 unredeemed reward points expiring tonight. Redeem now before they are lost: http://rewards-redeem-now.click",

    # ── Delivery / logistics smishing ──────────────────────────────────────
    "NOTICE: Your package could not be delivered due to incomplete address. Pay the redirection fee of $1.50 at http://usps-redirection.info",
    "Alert: Your UPS package is held at our warehouse. Click the link to pay outstanding duties: http://ups-delivery-duty.com",
    "DHL: your parcel is on hold pending a customs charge of £2.99. Settle here to release it: http://dhl-customs-settle.xyz",
    "FedEx: we attempted delivery twice. Reschedule and confirm your address: http://fedex-reschedule-now.info",
    "Royal Mail: your item has an unpaid shipping fee of £1.45. Pay now to avoid return to sender: http://royalmail-fee-pay.co",

    # ── Crypto / investment fraud ──────────────────────────────────────────
    "URGENT security alert for your crypto wallet. Upgrade to the new secure protocol to protect your assets: http://metamask-security.co",
    "Get rich quick! Invest $100 in our automated Bitcoin trading bot and earn $5000 daily guaranteed. Join now at http://quick-crypto-earn.club",
    "Dear MetaMask customer, our smart contract upgrade requires all wallets to re-verify. Enter your 12-word seed phrase at http://metamask-ledger-sec.com",
    "Exclusive airdrop: connect your wallet to claim 5 ETH before the pool closes: http://eth-airdrop-claim.xyz",
    "My mentor turned $500 into $12,000 in three weeks with this signal group. I can add you if you're serious about financial freedom.",
    "Hi, I'm a portfolio manager with 12 years experience. I only take five students per month. Guaranteed 30% monthly returns, capital fully protected.",
    "Your Coinbase account was flagged for review. Verify your identity and seed phrase to avoid asset freeze: http://coinbase-review-verify.info",
    "Limited slot: our AI forex bot has never had a losing week. Minimum deposit $250, withdraw anytime. Message me for the link.",

    # ── Malware delivery ───────────────────────────────────────────────────
    "ALERT: Critical security patch required for your account. Download and run the attachment patch.exe immediately.",
    "Urgent security patch: Chrome browser has a critical vulnerability. Click here to install update now: http://chrome-update-safety.net",
    "Hi team, we are upgrading our internal Slack client. Download the patch from our file store and run it: http://internal-eng-shares.info/slack_patch.exe",
    "Please review the attached invoice.docm and enable macros to see the full statement.",
    "Your Adobe Flash Player is out of date and blocking this video. Install the update to continue: http://flash-update-player.click",
    "Scanned document from the office printer is attached. Open scan_2847.htm and sign in to view it.",

    # ── Extortion / sextortion ─────────────────────────────────────────────
    "We have hacked your webcam and have embarrassing recordings. Pay $500 in Bitcoin to this address or we will release them to your contacts.",
    "I placed malware on the adult site you visited. I have your contact list. Send $1,200 in BTC within 48 hours or everyone sees the video.",
    "Your password is hunter2. I know everything about you. Transfer 0.03 BTC to the wallet below and I will delete the files.",
    "Your company's files have been encrypted. Contact us within 72 hours to negotiate the decryption key, or the data goes public.",

    # ── Romance / social-engineering, low urgency ──────────────────────────
    "Hey! I saw your profile and liked you. Check out my photos here and message me: http://scam-dating-link.xyz/pics",
    "Hello dear, I found your profile very inspiring. I am a widow living abroad and I am looking for an honest friend to share my late husband's estate with.",
    "Hi, sorry to bother you. I'm currently deployed overseas and can't access my bank. Could you help me with a small transfer? I'll repay double when I'm home.",
    "I've enjoyed our chats so much. I want to visit you but my flight deposit is short by $400. Could you send it via gift cards? It's the only method that works here.",
    "Hi mum, this is my new number, my phone broke. Can you transfer £850 to this account for me? I'll explain later.",
    "Hey, it's your nephew. I'm in trouble and I need bail money urgently but please don't tell my parents. Can you wire it today?",

    # ── Job / recruitment scams ────────────────────────────────────────────
    "Congratulations! Your resume was selected for a remote work-from-home position earning $80/hr. Deposit the setup fee at http://job-setup-pay.org",
    "We reviewed your profile and would like to offer you a package reshipping role. No interview needed. $3,000/month, start immediately.",
    "You have been shortlisted for a data entry role paying $45 per hour. To begin, purchase the required software licence and we will reimburse you.",
    "Hi, I'm hiring for a personal assistant. First task: deposit this cheque and forward the balance via wire. Keep $300 for yourself.",

    # ── Support / tech-support scams ───────────────────────────────────────
    "Microsoft Security: your computer is infected with 5 viruses. Call our certified technicians now on 1-800-555-0199 for immediate removal.",
    "Warning! Your system is at risk. Do not shut down your computer. Call Windows Support immediately at the number displayed.",
    "This is Apple Support. We detected iCloud breach activity on your device. Allow remote access so we can secure your files.",
    "Your antivirus subscription expired 3 days ago and your device is unprotected. Renew now for $19.99: http://av-renew-secure.info",

    # ── Authority impersonation ────────────────────────────────────────────
    "IRS Alert: We detected an unpaid tax refund under your name. Claim your tax credit now: http://irs-tax-refund-portal.org",
    "This is the final notice from the Social Security Administration. Your SSN has been suspended due to suspicious activity. Press 1 to speak to an officer.",
    "Notice from HMRC: you have an outstanding tax liability. Failure to respond within 24 hours will result in legal action: http://hmrc-settle-now.co",
    "Police notice: a warrant has been issued in your name. Settle the fine online immediately to avoid arrest: http://court-fine-settle.info",
    "Your electricity will be disconnected in 2 hours due to an unpaid bill. Call this number now to make an immediate payment.",

    # ── Business email compromise ──────────────────────────────────────────
    "Hi, I'm in a meeting and can't talk. I need you to purchase five $200 Apple gift cards for a client gift. Send me the codes and I'll reimburse you.",
    "Please process an urgent wire transfer to the new supplier account before end of day. Keep this confidential until the deal is announced.",
    "Our bank details have changed. Please update your records and send the outstanding payment to the new account attached.",
    "Are you at your desk? I need a quick favour and I can't call right now. Reply and I'll explain.",

    # ── Social media / messaging ───────────────────────────────────────────
    "Your Instagram account has violated our community guidelines. Appeal within 24 hours or it will be permanently deleted: http://ig-appeal-form.xyz",
    "Someone mentioned you in a comment. See what they said: http://fb-mention-view.click",
    "Forward this WhatsApp code to continue using your account. Our system needs it to verify your device.",
    "You've won an iPhone 16 in our WhatsApp anniversary giveaway! Share with 10 friends and claim here: http://wa-giveaway-claim.xyz",
    "Hi! Is this still your account? I found this video of you, it's so embarrassing: http://video-of-you.click",
    "Your Facebook page will be unpublished for copyright violation. Submit an appeal here within 12 hours: http://meta-appeal-center.info",

    # ── Subscription / streaming ───────────────────────────────────────────
    "Your Amazon Prime membership renews today at $139.99. To cancel, call 1-888-555-0177 within the next hour.",
    "Your Disney+ subscription could not be renewed. Update your payment details to avoid losing access: http://disney-billing-fix.xyz",
    "Your domain name expires today. Renew immediately to avoid losing your website and email: http://domain-renew-urgent.info",
]

LEGITIMATE_SAMPLES = [
    # ── Ordinary workplace correspondence ──────────────────────────────────
    "Hi team, just a reminder that our weekly progress meeting is scheduled for tomorrow at 10:00 AM in the main conference room.",
    "Hi, I completed the code reviews for the pull request. Let's merge it once the CI/CD pipeline builds successfully.",
    "Here is the updated project budget spreadsheet. Let me know if you have any questions or feedback before the board meeting.",
    "Hi Arpan, can you please double-check the database migration script? I want to make sure it doesn't drop the production schema.",
    "The draft for the CyberSentinel documentation is ready. Let's review the abstract and introduction sections this afternoon.",
    "Hi Merry, can you share the training metrics of the new XGBoost model? I want to add them to our final presentation slides.",
    "Hi, please find attached the receipts from our business trip last week. Let me know if you need any other documents for reimbursement.",
    "Quick note: I'll be working from home on Thursday. I'm reachable on Slack as usual and will join standup on video.",
    "The client pushed the demo to next Wednesday. I've updated the calendar invite and moved the internal dry run to Monday.",
    "Attaching the Q3 retrospective notes. The main action item is reducing our deploy time; I'll open a ticket for it.",
    "Could you review my design doc when you get a chance? No rush, I'd like feedback before the architecture sync on Friday.",
    "Thanks for covering the on-call shift last night. I saw the incident notes, good catch on the memory leak.",
    "Reminder: timesheets are due by Friday 5 PM. Let me know if you need help with the new system.",
    "I've booked the meeting room for the workshop. Bring your laptops; we'll be pair programming for most of the session.",
    "The staging environment is back up after the maintenance window. Please re-run your tests when convenient.",

    # ── Real transactional notifications (the hardest negatives) ───────────
    "Your order #1029384 has been shipped and is on its way. You can track your package details on our official portal.",
    "Your monthly electricity bill is now available. Log in to your utility portal to view the statement and make a payment.",
    "Hi, this is an automated notification that your password has been successfully changed. If you did this, no action is needed.",
    "Hello, your dental checkup appointment is confirmed for Friday, June 26th at 3:30 PM. Please arrive 10 minutes early.",
    "Your flight ticket to Chicago is confirmed. Flight details: AA-2409, departing 8:45 AM. Boarding pass is available in your app.",
    "Dear customer, your bank statement for May 2026 is now ready for download. Log in securely to your online banking portal.",
    "Your subscription to the cybersecurity newsletter has been successfully renewed. Thank you for your continued support.",
    "Hello, the library books you requested are now ready for pickup. Please collect them by next Tuesday.",
    "Your parcel was delivered today at 2:14 PM and left in the porch as instructed. Thanks for shopping with us.",
    "We received your payment of $49.00. Your receipt is attached and your next billing date is 12 March.",
    "Your table reservation for four at 7:30 PM on Saturday is confirmed. Please call the restaurant directly to make changes.",
    "Your prescription is ready for collection at your registered pharmacy. Opening hours are 9 AM to 6 PM Monday to Saturday.",
    "Thank you for your application. We have received it and our team will review it within ten working days.",
    "Your car service is booked for 14 April at 9 AM. Please bring your service book and drop the vehicle before 9:30.",
    "This is a reminder that your gym membership renews on the 1st of next month at the usual rate.",

    # ── Genuine security alerts (must not be flagged as phishing) ──────────
    "We noticed a new sign-in to your account from a Windows device in London. If this was you, no action is needed. If not, review your recent activity from your account settings.",
    "Your two-factor authentication was enabled successfully. Your recovery codes are available in your account security settings.",
    "A new device was added to your account. You can review and remove devices at any time from Settings, Security, Devices.",
    "Your recovery email address was updated. If you did not make this change, please contact our support team through the app.",
    "We are writing to let you know that we have completed our scheduled security maintenance. No customer action is required.",
    "Your API key was rotated as scheduled. The previous key remains valid for 24 hours to allow migration.",
    "As part of our routine security review, we will require all staff to complete phishing awareness training by the end of the quarter.",
    "Your session on the admin console expired after 30 minutes of inactivity. Please sign in again through the usual portal.",

    # ── Personal messages ──────────────────────────────────────────────────
    "Hey Joshua, are we still on for lunch today at 1 PM? Let me know if you want to try that new Italian place down the street.",
    "Happy birthday, Joshua! Wishing you a wonderful day filled with joy, laughter, and success. Hope to catch up soon!",
    "Hey, could you help me move this weekend? I need to carry some heavy furniture. I'll buy pizza and drinks for everyone!",
    "Just landed, everything went fine. I'll call you once I get to the hotel and have some dinner.",
    "Mum says dinner is at seven. Can you pick up bread on the way home? Thanks!",
    "That film was so much better than I expected. We should watch the sequel next weekend if you're free.",
    "Congratulations on the new job! Really well deserved. Let's celebrate properly when you're settled in.",
    "I left the keys with the neighbour. Give them a knock when you arrive and they'll hand them over.",
    "Are you free for a call this evening? Nothing urgent, just wanted to catch up properly.",
    "Thanks for the recommendation, I finished the book last night. Completely agree about the ending.",

    # ── Legitimate marketing and community mail ────────────────────────────
    "Thanks for subscribing to our newsletter! You will receive weekly updates regarding software development, React, and Django.",
    "Our spring sale starts Monday. Members get early access from Sunday evening. Unsubscribe any time using the link in the footer.",
    "You're invited to our free webinar on secure coding practices. Registration is optional and there is no cost to attend.",
    "This month's community digest: three new tutorials, a release summary, and highlights from the user forum.",
    "We've updated our privacy policy. The changes take effect on 1 June and a summary is available on our website.",
    "Your feedback helps us improve. If you have two minutes, we'd appreciate a short survey response, but it's entirely optional.",

    # ── Real recruiting and business correspondence ────────────────────────
    "Dear candidate, thank you for interviewing with us. We are pleased to extend a job offer for the Software Engineer role.",
    "Hi, following up on our conversation last week about the integration project. Are you available for a call on Tuesday?",
    "Thank you for your proposal. Our procurement team will review it and respond within two weeks through the usual channel.",
    "Please find the signed contract attached. Our finance team will process the first invoice at the end of the month.",
    "We've reviewed your CV and would like to invite you to a first-round interview. Please reply with a few times that suit you.",
    "The purchase order has been approved. You can invoice against PO-44821 using our standard billing address on file.",

    # ── Notifications that mention money without being scams ───────────────
    "Your salary payment has been processed and should appear in your account within one working day.",
    "A refund of $24.99 has been issued to your original payment method and should clear within five working days.",
    "Your invoice for March is attached. Payment terms are 30 days as agreed in our contract.",
    "Your account balance is low. You can top up from the app whenever convenient; no immediate action is required.",
    "The insurance renewal quote for this year is attached for your review. Your current policy runs until 30 September.",

    # ── Developer/platform notifications ───────────────────────────────────
    "[GitHub] Pull Request #14: Added OCR models and classifier logic. Arpan requested your review.",
    "Your build #4821 passed all checks. Deployment to staging completed in 3 minutes 12 seconds.",
    "A new version of the SDK is available. Release notes and the migration guide are on our documentation site.",
    "Your scheduled database backup completed successfully at 02:00 UTC. Retention is set to 30 days.",
    "The incident affecting API latency has been resolved. A full post-mortem will be published within five working days.",
    "Your monthly usage report is ready. You used 42% of your included quota this billing period.",
]

#: (text, label) pairs consumed by the classifier's training routine.
TRAINING_DATA = (
    [(text, 1) for text in PHISHING_SAMPLES]
    + [(text, 0) for text in LEGITIMATE_SAMPLES]
)
