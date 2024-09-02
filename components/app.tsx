'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ClipboardCopy, Plus, Edit, Trash2, Wand2, AlertTriangle, Star } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'

// Theme インターフェースの定義
interface Theme {
  id: number;
  name: string;
  fields: string[];
  promptTemplate: string;
  usage_count: number;
}

export function App() {
  const [themes, setThemes] = useState<Theme[]>([]);
  const [selectedTheme, setSelectedTheme] = useState<Theme | null>(null);
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [generatedPrompt, setGeneratedPrompt] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAddThemeDialogOpen, setIsAddThemeDialogOpen] = useState(false);
  const [isEditThemeDialogOpen, setIsEditThemeDialogOpen] = useState(false);
  const [newTheme, setNewTheme] = useState({ name: "", fields: ["", "", ""], promptTemplate: "" });
  const [editingTheme, setEditingTheme] = useState<Theme | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("generate")
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false)
  const [password, setPassword] = useState("")
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isResetConfirmDialogOpen, setIsResetConfirmDialogOpen] = useState(false)

  useEffect(() => {
    const loadThemes = async () => {
      try {
        const { data, error } = await supabase
          .from('themes')
          .select('*')
        if (error) throw error
        const formattedData = data.map(theme => ({
          ...theme,
          promptTemplate: theme.prompt_template
        }))
        setThemes(formattedData)
      } catch (err) {
        setError(err instanceof Error ? err.message : "テーマの読み込み中にエラーが発生しました。")
      }
    }

    loadThemes()
  }, [])

  const handleThemeChange = (themeId: string) => {
    try {
      const theme = themes.find(t => t.id === parseInt(themeId))
      if (!theme) throw new Error("選択されたテーマが見つかりません。")
      if (!theme.promptTemplate) throw new Error("選択されたテーマにプロンプトテンプレートが設定されていません。")
      console.log('Selected theme:', theme) // デバッグ用ログ
      setSelectedTheme(theme)
      setInputs({})
      setGeneratedPrompt("")
      setIsDialogOpen(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "不明なエラーが発生しました。")
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setInputs(prev => ({ ...prev, [field]: value }))
  }

  const generatePrompt = async () => {
    try {
      if (!selectedTheme) throw new Error("テーマが選択されていません。")
      if (!selectedTheme.promptTemplate) throw new Error("プロンプトテンプレートが設定されていません。")
      let prompt = selectedTheme.promptTemplate
      selectedTheme.fields.forEach(field => {
        if (!inputs[field]) throw new Error(`${field}が力されていません。`)
        prompt = prompt.replace(new RegExp(`\\{${field}\\}`, 'g'), inputs[field])
      })
      setGeneratedPrompt(prompt)
      setIsDialogOpen(false)

      // usage_countをインクリメント
      const { data, error } = await supabase
        .from('themes')
        .update({ usage_count: selectedTheme.usage_count + 1 })
        .eq('id', selectedTheme.id)
        .select()

      if (error) throw error

      // 更新されたテーマを反映
      setThemes(themes.map(theme => theme.id === selectedTheme.id ? data[0] : theme))
    } catch (err) {
      setError(err instanceof Error ? err.message : "プロンプトの生成中にエラーが発生しました。")
    }
  }

  const copyPrompt = () => {
    try {
      navigator.clipboard.writeText(generatedPrompt)
      // Here you could add a toast notification for copy success feedback
    } catch (err) {
      setError("プロンプトのコピーに失敗しました。")
    }
  }

  const handleAddTheme = async () => {
    try {
      if (!newTheme.name) throw new Error("テーマ名を入力してください。")
      if (newTheme.fields.some(f => !f)) throw new Error("すべてのフィールドを入力してください。")
      if (!newTheme.promptTemplate) throw new Error("プロンプトテンプレートを入力してください。")

      const { data, error } = await supabase
        .from('themes')
        .insert([
          {
            name: newTheme.name,
            fields: newTheme.fields.filter(f => f !== ""),
            prompt_template: newTheme.promptTemplate
          }
        ])
        .select()

      if (error) throw error

      setThemes([...themes, data[0]])
      setNewTheme({ name: "", fields: ["", "", ""], promptTemplate: "" })
      setIsAddThemeDialogOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "テーマの追加中にエラーが発生���ました。")
    }
  }

  const handleEditTheme = async () => {
    try {
      if (!editingTheme || !editingTheme.name) throw new Error("テーマ名を入力してください。")
      if (editingTheme.fields.some(f => !f)) throw new Error("すべてのフィールドを入力してください。")
      if (!editingTheme.promptTemplate) throw new Error("プロンプトテンプレートを入力してください。")

      const { data, error } = await supabase
        .from('themes')
        .update({
          name: editingTheme.name,
          fields: editingTheme.fields,
          prompt_template: editingTheme.promptTemplate
        })
        .eq('id', editingTheme.id)
        .select()

      if (error) throw error

      const updatedThemes = themes.map(theme => 
        theme.id === editingTheme.id ? data[0] : theme
      )
      setThemes(updatedThemes)
      setIsEditThemeDialogOpen(false)
      setEditingTheme(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "テーマの編集中にエラーが発生しました。")
    }
  }

  const handleDeleteTheme = async (themeId: number) => {
    try {
      const { error } = await supabase
        .from('themes')
        .delete()
        .eq('id', themeId)

      if (error) throw error

      const updatedThemes = themes.filter(theme => theme.id !== themeId)
      setThemes(updatedThemes)
      if (selectedTheme && selectedTheme.id === themeId) {
        setSelectedTheme(null)
        setInputs({})
        setGeneratedPrompt("")
      }
    } catch (err) {
      setError("テーマの削除中にエラーが発生しました。")
    }
  }

  const handleTabChange = (value: string) => {
    if (value === "manage" && !isAuthenticated) {
      setIsPasswordDialogOpen(true)
    } else {
      setActiveTab(value)
    }
  }

  const handlePasswordSubmit = () => {
    if (password === "0411") {
      setIsAuthenticated(true)
      setActiveTab("manage")
      setIsPasswordDialogOpen(false)
    } else {
      setError("パスワードが正しくありません。")
    }
    setPassword("")
  }

  const handleResetUsageCount = () => {
    setIsResetConfirmDialogOpen(true)
  }

  const confirmResetUsageCount = async () => {
    try {
      // 全てのテーマを取得
      const { data: themesToUpdate, error: fetchError } = await supabase
        .from('themes')
        .select('id')

      if (fetchError) throw fetchError

      // 各テーマの使用回数を個別に更新
      for (const theme of themesToUpdate) {
        const { error: updateError } = await supabase
          .from('themes')
          .update({ usage_count: 0 })
          .eq('id', theme.id)

        if (updateError) throw updateError
      }

      // すべてのテーマの使用回数を0にリセット（ローカルステート）
      setThemes(themes.map(theme => ({ ...theme, usage_count: 0 })))
      setIsResetConfirmDialogOpen(false)
    } catch (err) {
      console.error('Reset error:', err)
      setError(err instanceof Error ? err.message : "使用回数のリセット中にエラーが発生しました。")
    }
  }

  const getTopThemes = () => {
    return themes
      .sort((a, b) => b.usage_count - a.usage_count)
      .slice(0, 3)
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-4xl font-bold mb-8 text-center text-primary">Webプロンプト自動生成アプリ</h1>
      
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>エラー</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4 text-center">人気テーマランキング</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {getTopThemes().map((theme, index) => (
            <Card key={theme.id} className="shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col">
              <CardHeader className="pb-2">
                <CardTitle className="text-xl font-bold flex items-center h-16">
                  <span className={`text-2xl font-extrabold mr-2 ${index === 0 ? 'text-yellow-400' : index === 1 ? 'text-gray-400' : 'text-orange-400'}`}>
                    {index + 1}
                  </span>
                  <span className="line-clamp-2">{theme.name}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-sm text-gray-600 mb-2">使用回数: {theme.usage_count}</p>
              </CardContent>
              <CardFooter className="pt-2">
                <Button 
                  onClick={() => handleThemeChange(theme.id.toString())} 
                  className="w-full bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary transition-all duration-300"
                >
                  <Star className="mr-2 h-4 w-4" />
                  このテーマを選択
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="generate">プロンプト生成</TabsTrigger>
          <TabsTrigger value="manage">テーマ管理</TabsTrigger>
        </TabsList>
        <TabsContent value="generate">
          <Card>
            <CardHeader>
              <CardTitle>プロンプト生成</CardTitle>
              <CardDescription>テーマを選択し、必要な情報を入力してプロンプトを生成します</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Select onValueChange={handleThemeChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="テーマを選択してください" />
                  </SelectTrigger>
                  <SelectContent>
                    {themes.map(theme => (
                      <SelectItem key={theme.id} value={theme.id.toString()}>{theme.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedTheme && (
                  <div className="space-y-4">
                    {selectedTheme.fields.map(field => (
                      <div key={field}>
                        <Label htmlFor={field} className="text-sm font-medium">{field}</Label>
                        <Input
                          id={field}
                          name={field}
                          value={inputs[field] || ''}
                          onChange={(e) => handleInputChange(field, e.target.value)}
                          placeholder={`${field}を入力`}
                          className="mt-1"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={generatePrompt} className="w-full" disabled={!selectedTheme}>
                <Wand2 className="mr-2 h-4 w-4" />
                プロンプトを生成
              </Button>
            </CardFooter>
          </Card>
          {generatedPrompt && (
            <Card className="mt-8">
              <CardHeader>
                <CardTitle>生成されたプロンプト</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[200px] w-full rounded-md border p-4">
                  <p className="whitespace-pre-wrap">{generatedPrompt}</p>
                </ScrollArea>
              </CardContent>
              <CardFooter>
                <Button onClick={copyPrompt} className="w-full">
                  <ClipboardCopy className="mr-2 h-4 w-4" />
                  コピー
                </Button>
              </CardFooter>
            </Card>
          )}
        </TabsContent>
        <TabsContent value="manage">
          {isAuthenticated ? (
            <Card>
              <CardHeader>
                <CardTitle>テーマ管理</CardTitle>
                <CardDescription>テーマの追加、編集、削除、使用回数のリセットができます</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px] w-full rounded-md border p-4">
                  {themes.map(theme => (
                    <div key={theme.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                      <span className="font-medium">{theme.name}</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">使用回数: {theme.usage_count}</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditingTheme(theme)
                            setIsEditThemeDialogOpen(true)
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteTheme(theme.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </ScrollArea>
              </CardContent>
              <CardFooter>
                <div className="w-full flex justify-between">
                  <Button onClick={() => setIsAddThemeDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    新しいテーマを追加
                  </Button>
                  <Button onClick={handleResetUsageCount} variant="outline">
                    全テーマの使用回数をリセット
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>アクセス制限</CardTitle>
                <CardDescription>テーマ管理にアクセスするには認証が必要です。</CardDescription>
              </CardHeader>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={isAddThemeDialogOpen} onOpenChange={setIsAddThemeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新しいテーマを追加</DialogTitle>
            <DialogDescription>新しいテーマの名前、入力フィールド、プロンプトテンプレートを設定してください</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="themeName" className="text-sm font-medium">テーマ名</Label>
              <Input
                id="themeName"
                value={newTheme.name}
                onChange={(e) => setNewTheme(prev => ({ ...prev, name: e.target.value }))}
                placeholder="テーマ名を入力"
                className="mt-1"
              />
            </div>
            {newTheme.fields.map((field, index) => (
              <div key={index}>
                <Label htmlFor={`field${index}`} className="text-sm font-medium">フィールド {index + 1}</Label>
                <Input
                  id={`field${index}`}
                  value={field}
                  onChange={(e) => {
                    const updatedFields = [...newTheme.fields]
                    updatedFields[index] = e.target.value
                    setNewTheme(prev => ({ ...prev, fields: updatedFields }))
                  }}
                  placeholder={`フィールド ${index + 1} を入力`}
                  className="mt-1"
                />
              </div>
            ))}
            <div>
              <Label htmlFor="promptTemplate" className="text-sm font-medium">プロンプトテンプレート</Label>
              <Textarea
                id="promptTemplate"
                value={newTheme.promptTemplate}
                onChange={(e) => setNewTheme(prev => ({ ...prev, promptTemplate: e.target.value }))}
                placeholder="プロンプトテンプレートを入力（フィールドは {フィールド名} の形式で指定）"
                className="mt-1 h-32"
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleAddTheme}>テーマを追加</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditThemeDialogOpen} onOpenChange={setIsEditThemeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>テーマを編集</DialogTitle>
            <DialogDescription>テーマの名前、入力フィールド、プロンプトテンプレートを編集してください</DialogDescription>
          </DialogHeader>
          {editingTheme && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="editThemeName" className="text-sm font-medium">テーマ名</Label>
                <Input
                  id="editThemeName"
                  value={editingTheme.name}
                  onChange={(e) => setEditingTheme(prev => prev ? { ...prev, name: e.target.value } : null)}
                  placeholder="テーマ名を入力"
                  className="mt-1"
                />
              </div>
              {editingTheme.fields.map((field, index) => (
                <div key={index}>
                  <Label htmlFor={`editField${index}`} className="text-sm font-medium">フィールド {index + 1}</Label>
                  <Input
                    id={`editField${index}`}
                    value={field}
                    onChange={(e) => {
                      const updatedFields = [...editingTheme.fields]
                      updatedFields[index] = e.target.value
                      setEditingTheme(prev => prev ? { ...prev, fields: updatedFields } : null)
                    }}
                    placeholder={`フィールド ${index + 1} を入力`}
                    className="mt-1"
                  />
                </div>
              ))}
              <div>
                <Label htmlFor="editPromptTemplate" className="text-sm font-medium">プロンプトテンプレート</Label>
                <Textarea
                  id="editPromptTemplate"
                  value={editingTheme.promptTemplate}
                  onChange={(e) => setEditingTheme(prev => prev ? { ...prev, promptTemplate: e.target.value } : null)}
                  placeholder="プロンプトテンプレートを入力（フィールドは {フィールド名} の形式で指定）"
                  className="mt-1 h-32"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={handleEditTheme}>変更を保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>パスワード認証</DialogTitle>
            <DialogDescription>テーマ管理にアクセスするにはパスワードを入力してください。</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="パスワードを入力"
            />
          </div>
          <DialogFooter>
            <Button onClick={handlePasswordSubmit}>認証</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isResetConfirmDialogOpen} onOpenChange={setIsResetConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>使用回数のリセット確認</DialogTitle>
            <DialogDescription>全てのテーマの使用回数をリセットしてもよろしいですか？</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="パスワードを入力"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsResetConfirmDialogOpen(false)}>キャンセル</Button>
            <Button onClick={() => {
              if (password === "0411") {
                confirmResetUsageCount()
                setPassword("")
              } else {
                setError("パスワードが正しくありません。")
              }
            }}>リセット</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}