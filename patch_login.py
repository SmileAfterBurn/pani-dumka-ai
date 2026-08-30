import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

replacement = """    } catch (error: any) {
      console.error("Login error:", error);
      if (error.code === 'auth/internal-error' || error.message?.includes('internal-error')) {
        alert("Помилка авторизації. Якщо ви знаходитесь у прев'ю AI Studio (iframe), будь ласка, відкрийте застосунок у новій вкладці браузера (кнопка ↗️ вгорі справа), оскільки браузери блокують спливаючі вікна авторизації всередині iframe.");
      } else {
        alert(`Помилка входу: ${error.message}`);
      }
    }"""

content = re.sub(r'\} catch \(error\) \{\s*console\.error\("Login error:", error\);\s*\}', replacement, content)

with open('src/App.tsx', 'w') as f:
    f.write(content)
