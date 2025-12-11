import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { supabase } from '@/lib/supabase';

interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { notificationId: string } }
) {
  try {
    // Get token from cookies
    const token = request.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json(
        { 
          success: false,
          message: 'Authentication required. Please log in to update notifications.' 
        },
        { status: 401 }
      );
    }

    // Verify JWT token
    let decoded: JWTPayload;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
    } catch (jwtError) {
      return NextResponse.json(
        { 
          success: false,
          message: 'Invalid authentication token. Please log in again.' 
        },
        { status: 401 }
      );
    }

    const { notificationId } = params;

    if (!notificationId) {
      return NextResponse.json(
        { 
          success: false,
          message: 'Notification ID is required.' 
        },
        { status: 400 }
      );
    }

    try {
      // Update notification as read (only if it belongs to the user)
      const { data: updatedNotification, error: updateError } = await supabase
        .from('user_notifications')
        .update({
          read: true,
          read_at: new Date().toISOString()
        })
        .eq('id', notificationId)
        .eq('user_id', decoded.userId)
        .select()
        .single();

      if (updateError) {
        if (updateError.code === 'PGRST116') {
          return NextResponse.json(
            { 
              success: false,
              message: 'Notification not found or access denied.' 
            },
            { status: 404 }
          );
        }
        console.error('Error updating notification:', updateError);
        throw new Error(`Failed to update notification: ${updateError.message}`);
      }

      return NextResponse.json(
        {
          success: true,
          notification: {
            id: updatedNotification.id,
            read: updatedNotification.read,
            readAt: updatedNotification.read_at
          },
          message: 'Notification marked as read successfully.'
        },
        { status: 200 }
      );

    } catch (dbError: any) {
      console.error('Database error during notification update:', dbError);

      // Handle specific database errors
      if (dbError.message.includes('relation') && dbError.message.includes('does not exist')) {
        return NextResponse.json(
          { 
            success: false,
            message: 'Notification system not available. Please try again later.' 
          },
          { status: 503 }
        );
      }

      if (dbError.message.includes('connection') || dbError.message.includes('timeout')) {
        return NextResponse.json(
          { 
            success: false,
            message: 'Database connection issue. Please try again in a few moments.' 
          },
          { status: 503 }
        );
      }

      // Generic database error
      return NextResponse.json(
        { 
          success: false,
          message: 'Failed to update notification. Please try again later.' 
        },
        { status: 500 }
      );
    }

  } catch (error: any) {
    console.error('Notification update error:', error);
    return NextResponse.json(
      { 
        success: false,
        message: 'An unexpected error occurred. Please try again later.' 
      },
      { status: 500 }
    );
  }
}