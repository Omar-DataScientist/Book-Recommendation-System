import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './components/ui/select';
import { Input } from './components/ui/input';
import { Button } from './components/ui/button';
import { Slider } from './components/ui/slider';
import { ScrollArea } from './components/ui/scroll-area';
import { Plus, Sparkles } from 'lucide-react';
import './App.css';


const BookRecommendationApp = () => {
  const [currentPage, setCurrentPage] = useState('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('');
  const [minRating, setMinRating] = useState(4.0);
  const [recommendations, setRecommendations] = useState([]);
  const [chatMessage, setChatMessage] = useState('');
  const [chatResponses, setChatResponses] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [savedBooks, setSavedBooks] = useState([]);

  const BACKEND_URL = 'http://localhost:8000';

  const handleSaveBook = (book) => {
    setSavedBooks((prev) => {
      if (!prev.some((savedBook) => savedBook.title === book.title)) {
        return [...prev, book];
      }
      return prev;
    });
  };

  const handleSendMessage = async () => {
    if (!chatMessage.trim()) return;

    const userMessage = chatMessage.trim();
    setChatResponses((prev) => [...prev, { type: 'user', content: userMessage }]);
    setChatMessage('');

    try {
      const response = await fetch(`${BACKEND_URL}/api/books/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      const data = await response.json();
      setChatResponses((prev) => [...prev, { type: 'bot', content: data.response }]);
    } catch (error) {
      setChatResponses((prev) => [
        ...prev,
        { type: 'bot', content: 'Sorry, I encountered an error. Please try again.' }
      ]);
      console.error('Error:', error);
    }
  };

  const fetchRecommendations = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      const response = await fetch(`${BACKEND_URL}/api/books/recommend`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: searchQuery,
          genre: selectedGenre,
          min_rating: minRating,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      if (data.recommendations) {
        setRecommendations(data.recommendations);
      } else if (data.error) {
        setError(data.error);
      }
    } catch (error) {
      setError('Failed to fetch recommendations. Please try again.');
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };
  const renderHome = () => (
    <div className="h-full space-y-6">
      <Card className="bg-gradient-to-br from-indigo-900 to-purple-900 border-purple-600 shadow-lg shadow-purple-500/20">
        <CardHeader>
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Discover Books
          </CardTitle>
          <CardDescription className="text-purple-300">
            Find your next favorite read
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="What kind of books are you looking for?"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-indigo-950/50 border-purple-600 text-white placeholder:text-purple-400 focus:ring-purple-500 transition-all"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select value={selectedGenre} onValueChange={setSelectedGenre}>
              <SelectTrigger className="bg-indigo-950/50 border-purple-600 text-white">
                <SelectValue placeholder="Select Genre" />
              </SelectTrigger>
              <SelectContent className="bg-indigo-900 border-purple-600">
                <SelectItem value="fiction">Fiction</SelectItem>
                <SelectItem value="fantasy">Fantasy</SelectItem>
                <SelectItem value="mystery">Mystery</SelectItem>
                <SelectItem value="romance">Romance</SelectItem>
              </SelectContent>
            </Select>

            <div className="space-y-2">
              <label className="text-sm text-purple-300">Minimum Rating</label>
              <Slider
                value={[minRating]}
                min={1}
                max={5}
                step={0.1}
                onValueChange={(value) => setMinRating(value[0])}
                className="py-4"
              />
              <div className="text-sm text-purple-300 text-right">{minRating.toFixed(1)}</div>
            </div>
          </div>

          <Button 
            onClick={fetchRecommendations}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white transform hover:scale-[1.02] transition-all"
            disabled={isLoading}
          >
            <Sparkles className="w-4 h-4 mr-2" />
            {isLoading ? "Searching..." : "Get Recommendations"}
          </Button>
        </CardContent>
      </Card>

      {error && (
        <Card className="bg-red-900/50 border-red-600">
          <CardContent className="p-4">
            <p className="text-white">{error}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {recommendations.map((book, index) => (
          <Card key={index} className="bg-gradient-to-br from-indigo-900 to-purple-900 border-purple-600 hover:shadow-lg hover:shadow-purple-500/20 transition-all duration-300 relative group">
            <Button
              className="absolute top-4 right-4 p-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => handleSaveBook(book)}
            >
              <Plus className="w-4 h-4" />
            </Button>
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-purple-200">{book.title}</CardTitle>
              <CardDescription className="text-purple-400">
                {book.author} · {book.year}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-pink-500">★</span>
                  <span className="text-purple-200">{book.rating.toFixed(1)}</span>
                </div>
                <p className="text-sm text-purple-300">{book.description}</p>
                <p className="text-sm bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">{book.match_reason}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderLibrary = () => (
    <div className="h-full space-y-6">
      <Card className="bg-gradient-to-br from-indigo-900 to-purple-900 border-purple-600">
        <CardHeader>
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Your Library
          </CardTitle>
          <CardDescription className="text-purple-300">
            Your saved books
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {savedBooks.map((book, index) => (
          <Card key={index} className="bg-gradient-to-br from-indigo-900 to-purple-900 border-purple-600 hover:shadow-lg hover:shadow-purple-500/20 transition-all duration-300">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-purple-200">{book.title}</CardTitle>
              <CardDescription className="text-purple-400">
                {book.author} · {book.year}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-pink-500">★</span>
                  <span className="text-purple-200">{book.rating.toFixed(1)}</span>
                </div>
                <p className="text-sm text-purple-300">{book.description}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderChat = () => (
    <div className="h-full flex flex-col">
      <Card className="bg-gradient-to-br from-indigo-900 to-purple-900 border-purple-600 flex-1">
        <CardHeader>
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Chat with AI Book Assistant
          </CardTitle>
          <CardDescription className="text-purple-300">
            Ask questions or get personalized recommendations
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col h-[calc(100%-6rem)]">
          <ScrollArea className="flex-1 pr-4 mb-4">
            <div className="space-y-4">
              {chatResponses.map((msg, index) => (
                <div 
                  key={index} 
                  className={`p-3 rounded ${
                    msg.type === 'user' 
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 ml-auto max-w-[80%]' 
                      : 'bg-indigo-800/50 mr-auto max-w-[80%]'
                  }`}
                >
                  {msg.content}
                </div>
              ))}
            </div>
          </ScrollArea>
          <div className="flex gap-2">
            <Input
              placeholder="Ask about books..."
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              className="bg-indigo-950/50 border-purple-600 text-white placeholder:text-purple-400"
            />
            <Button 
              onClick={handleSendMessage}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
            >
              Send
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-indigo-950 to-purple-950 text-white">
      {/* Sidebar */}
      <div className="w-64 bg-black/40 backdrop-blur-xl p-6 flex flex-col gap-6 border-r border-purple-900">
        <div className="flex items-center gap-2 text-xl font-bold">
          <span className="animate-pulse">📚</span>
          <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Bookify</span>
        </div>

        <nav className="space-y-4">
          <Button 
            variant="ghost" 
            className={`w-full justify-start gap-2 text-white hover:text-white hover:bg-purple-900/50 transition-colors ${
              currentPage === 'home' ? 'bg-purple-900/50 border border-purple-600' : ''
            }`}
            onClick={() => setCurrentPage('home')}
          >
            🏠 Home
          </Button>
          <Button 
            variant="ghost" 
            className={`w-full justify-start gap-2 text-white hover:text-white hover:bg-purple-900/50 transition-colors ${
              currentPage === 'library' ? 'bg-purple-900/50 border border-purple-600' : ''
            }`}
            onClick={() => setCurrentPage('library')}
          >
            📚 Library
          </Button>
          <Button 
            variant="ghost" 
            className={`w-full justify-start gap-2 text-white hover:text-white hover:bg-purple-900/50 transition-colors ${
              currentPage === 'chat' ? 'bg-purple-900/50 border border-purple-600' : ''
            }`}
            onClick={() => setCurrentPage('chat')}
          >
            💬 Chat
          </Button>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 overflow-hidden">
        <div className="h-full">
          {currentPage === 'home' && renderHome()}
          {currentPage === 'library' && renderLibrary()}
          {currentPage === 'chat' && renderChat()}
        </div>
      </div>
    </div>
  );
};

export default BookRecommendationApp;