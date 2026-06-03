
/**
 * Utility functions for Google Sheets integration.
 * This integration uses Make.com (formerly Integromat) as a middleware to connect to Google Sheets,
 * which simplifies the integration and avoids CORS issues.
 */

/**
 * Send registration data to Google Sheets via a Make.com webhook
 * @param formData The registration form data
 * @returns An object with success status and message
 */
export const sendRegistrationToGoogleSheets = async (formData: any) => {
  try {
    // Use the specific registration webhook URL
    const webhookUrl = 'https://hook.us2.make.com/ecf68fra8e9x3i8jwjyn3c6kfu4x4g7f';
    
    if (!webhookUrl) {
      console.error('No Make.com webhook URL specified for registration.');
      return { success: false, message: 'Google Sheets integration not configured' };
    }
    
    // Calculate fee
    let baseFee = 79000;
    let discount = 0;
    
    if (formData.hasIELTS) discount += 10000;
    if (formData.hasSAT) discount += 10000;
    
    const finalFee = baseFee - discount;
    
    // Prepare the data for the webhook
    const registrationData = {
      ...formData,
      date_submitted: new Date().toISOString(),
      original_fee: baseFee,
      discount_amount: discount,
      final_fee: finalFee,
      submission_source: window.location.hostname
    };
    
    console.log('Sending registration data to Google Sheets via webhook:', webhookUrl);
    
    // Send the data to Make.com webhook
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      mode: 'no-cors', // Handle CORS issues
      body: JSON.stringify(registrationData),
    });
    
    // Since we're using no-cors, we'll assume it worked
    console.log('Registration sent to Google Sheets via Make.com webhook');
    return { success: true, message: 'Application submitted successfully' };
  } catch (error) {
    console.error('Error sending registration to Google Sheets:', error);
    return { success: false, message: 'Failed to send application to Google Sheets' };
  }
};
