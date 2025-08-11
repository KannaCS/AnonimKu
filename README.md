# AnonimKu - Anonymous Chat Application

AnonimKu is a modern anonymous chat application where strangers can connect and chat without revealing their identities initially. Users can choose to reveal their profiles when they feel comfortable, but only with mutual consent.

## Features

- **Anonymous Matching**: Users are matched with strangers without seeing each other's profiles
- **Real-time Messaging**: Instant messaging with live updates
- **Profile Reveal System**: Mutual consent required before profiles are revealed
- **Phone Authentication**: Simple authentication using name and phone number
- **Responsive Design**: Works seamlessly on mobile and desktop devices
- **Secure**: Built with privacy and security in mind

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Authentication**: NextAuth.js
- **Database**: Supabase (PostgreSQL)
- **Real-time**: Supabase Realtime
- **UI Icons**: Lucide React

## Setup Instructions

### 1. Prerequisites

- Node.js 18+ installed
- A Supabase account and project

### 2. Environment Variables

Create a `.env.local` file in the root directory:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-key

# Socket.IO Configuration (optional)
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
```

### 3. Database Setup

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Run the SQL script from `supabase/schema.sql` to create all tables and functions

### 4. Install Dependencies

```bash
npm install
```

### 5. Run the Application

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Database Schema

The application uses the following main tables:

- **users**: Store user information (name, phone, online status)
- **matches**: Track active chat sessions between users
- **messages**: Store chat messages with timestamps
- **reveal_requests**: Handle profile reveal requests and responses

## User Flow

1. **Registration**: User enters name and phone number
2. **Matching**: System finds another available user to chat with
3. **Anonymous Chat**: Users chat without seeing each other's profiles
4. **Profile Reveal**: Either user can request to reveal profiles
5. **Mutual Consent**: Both users must agree before profiles are shown
6. **End Chat**: Users can end the chat session anytime

## API Routes

- `/api/auth/[...nextauth]` - NextAuth authentication endpoints

## Key Components

- **SessionProvider**: Manages user authentication state
- **ErrorBoundary**: Handles application errors gracefully
- **LoadingSpinner**: Reusable loading indicator component

## Features in Detail

### Authentication
- Simple phone number based authentication
- No complex signup process
- Automatic user creation/update

### Matching System
- Random matching algorithm
- Real-time availability checking
- Prevents users from matching with themselves

### Chat Interface
- Real-time message delivery
- Message timestamps
- Typing indicators (can be added)
- End chat functionality

### Profile Reveal System
- Request/accept mechanism
- Both parties must consent
- Profiles shown simultaneously
- Includes name and phone number

## Security Features

- Row Level Security (RLS) enabled on all tables
- Users can only see their own data and matched conversations
- Phone number validation
- Secure session management

## Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically

### Other Platforms

The application can be deployed to any platform that supports Next.js:
- Netlify
- Railway
- Heroku
- AWS

## Development

### Running in Development

```bash
npm run dev
```

### Building for Production

```bash
npm run build
npm run start
```

### Linting

```bash
npm run lint
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Privacy & Safety

- User data is stored securely in Supabase
- Phone numbers are used only for matching and identification
- No data is shared without user consent
- Users can end conversations anytime
- All communications are through the platform only

## Support

For support or questions, please open an issue in the GitHub repository.

## License

This project is licensed under the MIT License.